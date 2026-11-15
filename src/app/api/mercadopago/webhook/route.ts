import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";
import { generateTicketCode } from "@/lib/qr";
import type { TicketOrderItemRow } from "@/lib/database.types";

// Maps a Mercado Pago payment status to our booking status.
// approved -> confirmed, rejected/cancelled -> cancelled (frees the slot),
// anything else (pending/in_process/...) leaves the booking as-is (the
// pending_payment hold keeps blocking the slot until it expires or resolves).
function bookingStatusFor(mpStatus: string): "confirmed" | "cancelled" | null {
  if (mpStatus === "approved") return "confirmed";
  if (mpStatus === "rejected" || mpStatus === "cancelled") return "cancelled";
  return null;
}

function ticketOrderStatusFor(mpStatus: string): "paid" | "cancelled" | null {
  if (mpStatus === "approved") return "paid";
  if (mpStatus === "rejected" || mpStatus === "cancelled") return "cancelled";
  return null;
}

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

async function handleBookingPayment(
  supabase: SupabaseServiceClient,
  bookingId: string,
  mpStatus: string,
  dataId: string
) {
  const newStatus = bookingStatusFor(mpStatus);
  const update: Record<string, unknown> = { mp_payment_id: dataId };
  if (newStatus) update.status = newStatus;

  const { error } = await supabase
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .in("status", ["pending_payment", "confirmed"]);

  if (error) console.error("[mp-webhook] error actualizando la reserva", error);
  return !error;
}

async function handleTicketOrderPayment(
  supabase: SupabaseServiceClient,
  orderId: string,
  mpStatus: string,
  dataId: string
) {
  const newStatus = ticketOrderStatusFor(mpStatus);
  if (!newStatus) {
    // pending/in_process: leave the hold as-is, nothing to do yet.
    return true;
  }

  // Only act once — if the order isn't pending_payment anymore, another
  // notification already handled it (idempotency belt-and-suspenders on
  // top of the payment_events unique constraint).
  const { data: order, error: fetchError } = await supabase
    .from("ticket_orders")
    .select("id, event_id, status")
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .maybeSingle();
  if (fetchError) {
    console.error("[mp-webhook] error leyendo la orden de entradas", fetchError);
    return false;
  }
  if (!order) return true;

  const { error: updateError } = await supabase
    .from("ticket_orders")
    .update({ status: newStatus, mp_payment_id: dataId })
    .eq("id", orderId)
    .eq("status", "pending_payment");
  if (updateError) {
    console.error("[mp-webhook] error actualizando la orden de entradas", updateError);
    return false;
  }

  if (newStatus === "cancelled") {
    // Payment was rejected — release the reserved stock back.
    const { data: items } = await supabase
      .from("ticket_order_items")
      .select("ticket_type_id, quantity")
      .eq("order_id", orderId);
    for (const item of (items as TicketOrderItemRow[] | null) ?? []) {
      await supabase.rpc("release_ticket_type", {
        p_ticket_type_id: item.ticket_type_id,
        p_qty: item.quantity,
      });
    }
    return true;
  }

  // Paid: mint one scannable ticket row per unit purchased.
  const { data: items } = await supabase
    .from("ticket_order_items")
    .select("ticket_type_id, quantity")
    .eq("order_id", orderId);

  const ticketRows = ((items as TicketOrderItemRow[] | null) ?? []).flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: orderId,
      ticket_type_id: item.ticket_type_id,
      event_id: order.event_id,
      code: generateTicketCode(),
    }))
  );
  if (ticketRows.length > 0) {
    const { error: ticketsError } = await supabase.from("tickets").insert(ticketRows);
    if (ticketsError) console.error("[mp-webhook] error creando tickets", ticketsError);
  }

  return true;
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl;
  const bodyText = await request.text();
  let body: Record<string, unknown> = {};
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    // Some MP notifications arrive with an empty body — query params carry
    // everything we need in that case.
  }

  const type =
    url.searchParams.get("type") ?? url.searchParams.get("topic") ?? (body.type as string | undefined);
  const dataId =
    url.searchParams.get("data.id") ??
    ((body.data as { id?: string } | undefined)?.id ?? null);

  if (type !== "payment" || !dataId) {
    // Not a payment notification (e.g. merchant_order) — acknowledge and ignore.
    return NextResponse.json({ ok: true });
  }

  const secretConfigured = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET);
  if (secretConfigured) {
    const valid = verifyWebhookSignature({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
    });
    if (!valid) {
      console.error("[mp-webhook] firma inválida, notificación rechazada");
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } else {
    console.warn("[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — firma NO verificada");
  }

  const supabase = createServiceRoleClient();

  let payment;
  try {
    payment = await getPayment(dataId);
  } catch (err) {
    console.error("[mp-webhook] error consultando el pago en Mercado Pago", err);
    return NextResponse.json({ error: "lookup failed" }, { status: 502 });
  }

  const mpStatus = payment.status ?? "unknown";
  const reference = payment.external_reference;
  if (!reference) {
    return NextResponse.json({ ok: true });
  }

  // Prefixed at preference-creation time: "booking:<uuid>" or "ticket:<uuid>".
  const [kind, refId] = reference.includes(":") ? reference.split(":") : [null, reference];
  if (!refId || (kind !== "booking" && kind !== "ticket")) {
    console.warn("[mp-webhook] external_reference con formato desconocido", reference);
    return NextResponse.json({ ok: true });
  }

  // Idempotency: if we've already recorded this exact (payment, status)
  // pair, don't re-apply it (MP retries notifications aggressively).
  const { error: eventError } = await supabase.from("payment_events").insert({
    mp_payment_id: dataId,
    booking_id: kind === "booking" ? refId : null,
    ticket_order_id: kind === "ticket" ? refId : null,
    status: mpStatus,
    raw_payload: payment as unknown,
  });
  if (eventError) {
    if (eventError.code === "23505") {
      return NextResponse.json({ ok: true, deduped: true });
    }
    console.error("[mp-webhook] error registrando payment_event", eventError);
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  const ok =
    kind === "booking"
      ? await handleBookingPayment(supabase, refId, mpStatus, dataId)
      : await handleTicketOrderPayment(supabase, refId, mpStatus, dataId);

  if (!ok) {
    return NextResponse.json({ error: "db error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
