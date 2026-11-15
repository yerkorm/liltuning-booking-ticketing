import { NextResponse } from "next/server";
import { z } from "zod";
import { getStaffProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["staff", "super_admin"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/staff/[id]">) {
  const profile = await getStaffProfile();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (id === profile.id && (parsed.data.role === "staff" || parsed.data.active === false)) {
    return NextResponse.json(
      { error: "No puedes quitarte tu propio rol de super administrador ni desactivarte a ti mismo" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) update.full_name = parsed.data.fullName;
  if (parsed.data.role !== undefined) update.role = parsed.data.role;
  if (parsed.data.active !== undefined) update.active = parsed.data.active;

  const adminClient = createServiceRoleClient();
  const { error } = await adminClient.from("staff_users").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/staff/[id]">) {
  const profile = await getStaffProfile();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (id === profile.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();
  await adminClient.from("staff_users").delete().eq("id", id);
  await adminClient.auth.admin.deleteUser(id);

  return NextResponse.json({ ok: true });
}
