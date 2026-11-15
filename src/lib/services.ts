import { createServiceRoleClient } from "@/lib/supabase/server";
import type { ServiceRow } from "@/lib/database.types";

export type Service = ServiceRow;

export async function getActiveServices(): Promise<Service[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as Service[]) ?? [];
  } catch (err) {
    console.error("[services] no se pudo leer services, devolviendo lista vacía", err);
    return [];
  }
}
