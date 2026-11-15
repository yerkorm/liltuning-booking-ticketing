"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import type { SiteSettings } from "@/lib/settings";

export async function updateSiteSettings(values: SiteSettings) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const rows = Object.entries(values).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
}
