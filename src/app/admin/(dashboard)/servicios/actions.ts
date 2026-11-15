"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export async function createService(input: {
  name: string;
  description: string;
  durationMinutes: number;
}) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    name: input.name,
    slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
    description: input.description,
    duration_minutes: input.durationMinutes,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/");
}

export async function updateService(
  id: string,
  input: { name: string; description: string; durationMinutes: number }
) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name,
      description: input.description,
      duration_minutes: input.durationMinutes,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/");
}

export async function toggleServiceActive(id: string, active: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/servicios");
  revalidatePath("/servicios");
  revalidatePath("/");
}
