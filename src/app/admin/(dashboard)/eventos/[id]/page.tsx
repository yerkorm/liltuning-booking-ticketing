import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventEditForm } from "@/components/admin/EventEditForm";
import { TicketTypesManager } from "@/components/admin/TicketTypesManager";
import type { TicketRow } from "@/lib/database.types";

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const [{ data: ticketTypes }, { data: paidOrders }, { data: issuedTickets }] = await Promise.all([
    supabase.from("ticket_types").select("*").eq("event_id", id).order("sort_order", { ascending: true }),
    supabase.from("ticket_orders").select("total_amount_clp").eq("event_id", id).eq("status", "paid"),
    supabase.from("tickets").select("ticket_type_id, status").eq("event_id", id),
  ]);

  const revenue = (paidOrders ?? []).reduce((sum, o) => sum + o.total_amount_clp, 0);
  const soldByType: Record<string, number> = {};
  const usedCount = ((issuedTickets as TicketRow[] | null) ?? []).filter((t) => t.status === "used").length;
  for (const t of (issuedTickets as TicketRow[] | null) ?? []) {
    soldByType[t.ticket_type_id] = (soldByType[t.ticket_type_id] ?? 0) + 1;
  }

  return (
    <div>
      <p className="text-xs text-neutral-400 mb-1">
        <Link href="/admin/eventos" className="hover:text-brand-red">
          ← Eventos
        </Link>
      </p>
      <h1 className="heading-condensed text-2xl mb-6">{event.name}</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Órdenes pagadas" value={String((paidOrders ?? []).length)} />
        <StatCard label="Ingresos" value={`$${revenue.toLocaleString("es-CL")}`} />
        <StatCard label="Entradas usadas" value={`${usedCount}/${(issuedTickets ?? []).length}`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="heading-condensed text-lg mb-4">Datos del evento</h2>
          <EventEditForm event={event} />
        </div>
        <div>
          <h2 className="heading-condensed text-lg mb-4">Tipos de entrada</h2>
          <TicketTypesManager eventId={event.id} ticketTypes={ticketTypes ?? []} soldByType={soldByType} />
        </div>
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
