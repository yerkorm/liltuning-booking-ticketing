import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  completed: "Completada",
  no_show: "No se presentó",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export default async function DashboardPage() {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, deposit_amount_clp, booking_date")
    .order("booking_date", { ascending: false });

  const rows = bookings ?? [];
  const totalBookings = rows.length;
  const revenue = rows
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.deposit_amount_clp, 0);

  const byStatus = rows.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter((b) => b.booking_date === today).length;

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-4 mb-10">
        <StatCard label="Reservas totales" value={totalBookings.toString()} />
        <StatCard label="Reservas hoy" value={todayCount.toString()} />
        <StatCard label="Ingresos por abonos" value={`$${revenue.toLocaleString("es-CL")}`} />
        <StatCard label="Pendientes de pago" value={(byStatus.pending_payment ?? 0).toString()} />
      </div>

      <h2 className="heading-condensed text-lg mb-4">Reservas por estado</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(STATUS_LABEL).map(([status, label]) => (
          <div key={status} className="border border-neutral-200 rounded-sm p-4 flex justify-between">
            <span className="text-sm text-neutral-600">{label}</span>
            <span className="heading-condensed">{byStatus[status] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-200 rounded-sm p-5 bg-white">
      <p className="text-xs heading-condensed text-neutral-500">{label}</p>
      <p className="heading-condensed text-2xl mt-1">{value}</p>
    </div>
  );
}
