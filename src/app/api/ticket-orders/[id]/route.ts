import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { renderQrSvg } from "@/lib/qr";
import type { TicketRow } from "@/lib/database.types";

// Public, read-only status lookup for the order confirmation page. The
// order id (a UUID) acts as the access token. Once paid, includes each
// ticket's code + a ready-to-render QR SVG (generated server-side only).
export async function GET(_request: Request, ctx: RouteContext<"/api/ticket-orders/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServiceRoleClient();

  const { data: order } = await supabase
    .from("ticket_orders")
    .select("id, status, total_amount_clp, buyer_name, event_id")
    .eq("id", id)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("name, slug, venue, starts_at")
    .eq("id", order.event_id)
    .maybeSingle();

  let tickets: { id: string; code: string; typeName: string; qrSvg: string }[] = [];
  if (order.status === "paid") {
    const { data: ticketRows } = await supabase
      .from("tickets")
      .select("id, code, ticket_type_id, status")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    const typeIds = [...new Set((ticketRows as TicketRow[] | null ?? []).map((t) => t.ticket_type_id))];
    const { data: types } = await supabase.from("ticket_types").select("id, name").in("id", typeIds);
    const typeNameById = new Map((types ?? []).map((t) => [t.id, t.name as string]));

    tickets = await Promise.all(
      (ticketRows as TicketRow[] | null ?? []).map(async (t) => ({
        id: t.id,
        code: t.code,
        typeName: typeNameById.get(t.ticket_type_id) ?? "",
        qrSvg: await renderQrSvg(t.code),
      }))
    );
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    totalAmountClp: order.total_amount_clp,
    buyerName: order.buyer_name,
    event: event ? { name: event.name, slug: event.slug, venue: event.venue, startsAt: event.starts_at } : null,
    tickets,
  });
}
