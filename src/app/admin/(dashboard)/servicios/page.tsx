import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/admin/ServicesManager";

export default async function AdminServiciosPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Servicios</h1>
      <ServicesManager services={services ?? []} />
    </div>
  );
}
