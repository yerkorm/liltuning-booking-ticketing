import { createClient } from "@/lib/supabase/server";
import { todayDateOnly } from "@/lib/availability";
import { BookingsTable, type BookingRow } from "@/components/admin/BookingsTable";

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayDateOnly();

  const supabase = await createClient();

  const [{ data: bookings }, { data: staffOptions }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, booking_time, status, customer_name, customer_phone, vehicle_make, vehicle_model, vehicle_plate, deposit_amount_clp, assigned_staff_id, services(name)"
      )
      .eq("booking_date", selectedDate)
      .neq("status", "expired")
      .order("booking_time", { ascending: true }),
    supabase.from("staff_users").select("id, full_name").eq("active", true),
  ]);

  const rows: BookingRow[] = (bookings ?? []).map((b) => ({
    id: b.id,
    booking_time: b.booking_time,
    status: b.status,
    customer_name: b.customer_name,
    customer_phone: b.customer_phone,
    vehicle_make: b.vehicle_make,
    vehicle_model: b.vehicle_model,
    vehicle_plate: b.vehicle_plate,
    deposit_amount_clp: b.deposit_amount_clp,
    assigned_staff_id: b.assigned_staff_id,
    // @ts-expect-error - supabase-js types the embedded relation as an array by default
    serviceName: b.services?.name ?? "—",
  }));

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Reservas</h1>

      <form className="mb-6 flex items-center gap-3">
        <label className="text-xs heading-condensed text-neutral-500">Fecha</label>
        <input type="date" name="date" defaultValue={selectedDate} className="input w-auto" />
        <button type="submit" className="text-xs heading-condensed text-brand-red">
          Ver
        </button>
      </form>

      <BookingsTable bookings={rows} staffOptions={staffOptions ?? []} />
    </div>
  );
}
