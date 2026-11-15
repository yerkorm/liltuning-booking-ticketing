import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createTicketOrderPreference } from "@/lib/mercadopago";
import { BOOKING_HOLD_MINUTES } from "@/lib/constants";
import type { TicketTypeRow } from "@/lib/database.types";

const bodySchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().min(1).max(50),
      })
    )
    .min(1)
    .max(10),
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email(),
  buyerPhone: z.string().trim().min(6).max(30),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const supabase = createServiceRoleClient();

  await supabase.rpc("expire_stale_ticket_orders");

  const { data: event } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", body.eventId)
    .maybeSingle();
  if (!event || event.status !== "published") {
    return NextResponse.json({ error: "Evento no disponible" }, { status: 400 });
  }

  const ticketTypeIds = body.items.map((i) => i.ticketTypeId);
  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .in("id", ticketTypeIds)
    .eq("event_id", body.eventId)
    .eq("active", true);
  const ticketTypeById = new Map((ticketTypes as TicketTypeRow[] | null ?? []).map((t) => [t.id, t]));

  for (const item of body.items) {
    const tt = ticketTypeById.get(item.ticketTypeId);
    if (!tt) {
      return NextResponse.json({ error: "Tipo de entrada no disponible" }, { status: 400 });
    }
    if (item.quantity > tt.max_per_order) {
      return NextResponse.json(
        { error: `Máximo ${tt.max_per_order} entradas "${tt.name}" por compra` },
        { status: 400 }
      );
    }
  }

  // Atomic reservation per ticket type. If any fails (sold out), release
  // whatever we already reserved in this request before bailing out.
  const reserved: { ticketTypeId: string; quantity: number }[] = [];
  for (const item of body.items) {
    const { data: ok } = await supabase.rpc("reserve_ticket_type", {
      p_ticket_type_id: item.ticketTypeId,
      p_qty: item.quantity,
    });
    if (!ok) {
      for (const r of reserved) {
        await supabase.rpc("release_ticket_type", { p_ticket_type_id: r.ticketTypeId, p_qty: r.quantity });
      }
      const name = ticketTypeById.get(item.ticketTypeId)?.name ?? "seleccionada";
      return NextResponse.json({ error: `No quedan cupos suficientes para "${name}"` }, { status: 409 });
    }
    reserved.push({ ticketTypeId: item.ticketTypeId, quantity: item.quantity });
  }

  const totalAmountClp = body.items.reduce((sum, item) => {
    const tt = ticketTypeById.get(item.ticketTypeId)!;
    return sum + tt.price_clp * item.quantity;
  }, 0);

  async function rollbackReservation() {
    for (const r of reserved) {
      await supabase.rpc("release_ticket_type", { p_ticket_type_id: r.ticketTypeId, p_qty: r.quantity });
    }
  }

  const expiresAt = new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000).toISOString();

  const { data: order, error: orderError } = await supabase
    .from("ticket_orders")
    .insert({
      event_id: body.eventId,
      buyer_name: body.buyerName,
      buyer_email: body.buyerEmail,
      buyer_phone: body.buyerPhone,
      total_amount_clp: totalAmountClp,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    await rollbackReservation();
    return NextResponse.json({ error: "No se pudo crear la orden" }, { status: 500 });
  }

  const itemRows = body.items.map((item) => ({
    order_id: order.id,
    ticket_type_id: item.ticketTypeId,
    quantity: item.quantity,
    unit_price_clp: ticketTypeById.get(item.ticketTypeId)!.price_clp,
  }));
  const { error: itemsError } = await supabase.from("ticket_order_items").insert(itemRows);
  if (itemsError) {
    await rollbackReservation();
    await supabase.from("ticket_orders").update({ status: "cancelled" }).eq("id", order.id);
    return NextResponse.json({ error: "No se pudo crear la orden" }, { status: 500 });
  }

  try {
    const preference = await createTicketOrderPreference({
      orderId: order.id,
      eventName: event.name,
      buyerEmail: body.buyerEmail,
      items: body.items.map((item) => {
        const tt = ticketTypeById.get(item.ticketTypeId)!;
        return { ticketTypeId: tt.id, name: tt.name, quantity: item.quantity, unitPriceClp: tt.price_clp };
      }),
    });

    await supabase.from("ticket_orders").update({ mp_preference_id: preference.id }).eq("id", order.id);

    const isSandbox = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").startsWith("TEST-");
    const checkoutUrl = isSandbox ? preference.sandbox_init_point : preference.init_point;

    return NextResponse.json({ orderId: order.id, checkoutUrl });
  } catch (err) {
    await rollbackReservation();
    await supabase.from("ticket_orders").update({ status: "cancelled" }).eq("id", order.id);
    console.error("[ticket-orders] error creando preferencia de Mercado Pago", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
}
