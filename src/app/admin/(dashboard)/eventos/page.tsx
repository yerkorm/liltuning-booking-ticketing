import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventsManager } from "@/components/admin/EventsManager";

export default async function AdminEventosPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Eventos</h1>
      <EventsManager events={events ?? []} />
    </div>
  );
}
