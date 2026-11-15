import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStaffProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(["staff", "super_admin"]),
});

export async function POST(request: NextRequest) {
  const profile = await getStaffProfile();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, fullName, role } = parsed.data;

  const adminClient = createServiceRoleClient();

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear el usuario" },
      { status: 400 }
    );
  }

  const { error: profileError } = await adminClient.from("staff_users").insert({
    id: created.user.id,
    full_name: fullName,
    role,
  });
  if (profileError) {
    // Roll back the auth user so we don't leave an orphaned login with no role.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ id: created.user.id });
}
