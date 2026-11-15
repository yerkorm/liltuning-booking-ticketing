import { createClient } from "@/lib/supabase/server";
import { AvailabilityManager } from "@/components/admin/AvailabilityManager";

export default async function DisponibilidadPage() {
  const supabase = await createClient();

  const [{ data: rules }, { data: closedDates }] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("id, day_of_week, start_time, end_time, slot_duration_minutes, active")
      .order("day_of_week", { ascending: true }),
    supabase.from("closed_dates").select("id, date, reason").order("date", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Disponibilidad</h1>
      <AvailabilityManager rules={rules ?? []} closedDates={closedDates ?? []} />
    </div>
  );
}
