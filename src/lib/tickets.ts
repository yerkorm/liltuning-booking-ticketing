import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventRow, TicketTypeRow } from "@/lib/database.types";

export type EventWithTypes = EventRow & { ticketTypes: TicketTypeRow[] };

// Demo event shown ONLY while Supabase isn't reachable yet (placeholder
// credentials in .env.local) — lets the client preview the ticketing UI
// before a real project exists. The moment a real Supabase project answers,
// these functions succeed normally and this fallback never triggers.
// Safe to delete once supabase/tickets.sql + seed_tickets.sql have run for
// real — search this file for "DEMO_EVENT" to remove it.
const DEMO_EVENT: EventRow = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Encuentro LilTuning Car Audio",
  slug: "encuentro-liltuning-car-audio",
  description:
    "Exhibición de autos con sistemas de audio instalados por LilTuning, música en vivo y competencia de sonido (SPL). Evento de ejemplo — reemplázalo por el real desde Admin -> Eventos.",
  venue: "Por confirmar",
  starts_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ends_at: null,
  image_url: null,
  status: "published",
  created_at: new Date().toISOString(),
};

const DEMO_TICKET_TYPES: TicketTypeRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000002",
    event_id: DEMO_EVENT.id,
    name: "General",
    price_clp: 5000,
    quantity_total: 100,
    quantity_sold: 34,
    max_per_order: 10,
    active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    event_id: DEMO_EVENT.id,
    name: "VIP (acceso zona reservada)",
    price_clp: 12000,
    quantity_total: 30,
    quantity_sold: 27,
    max_per_order: 4,
    active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

// Server-only, public-facing. Published events from today onward, soonest first.
export async function getPublishedEvents(): Promise<EventRow[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "published")
      .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return (data as EventRow[]) ?? [];
  } catch (err) {
    console.error("[tickets] no se pudo leer events, mostrando evento de ejemplo (DEMO_EVENT)", err);
    return [DEMO_EVENT];
  }
}

export async function getPublishedEventBySlug(slug: string): Promise<EventWithTypes | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    if (!event) return null;

    const { data: ticketTypes } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", event.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    return { ...(event as EventRow), ticketTypes: (ticketTypes as TicketTypeRow[]) ?? [] };
  } catch (err) {
    console.error("[tickets] no se pudo leer el evento, usando evento de ejemplo si coincide (DEMO_EVENT)", err);
    if (slug === DEMO_EVENT.slug) return { ...DEMO_EVENT, ticketTypes: DEMO_TICKET_TYPES };
    return null;
  }
}
