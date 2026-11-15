import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { expireStaleBookings, getAvailableSlots, todayDateOnly } from "@/lib/availability";
import { createBookingPreference } from "@/lib/mercadopago";
import { BOOKING_HOLD_MINUTES } from "@/lib/constants";

const bodySchema = z.object({
  serviceId: z.string().uuid(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.string().trim().email(),
  vehicleMake: z.string().trim().max(60).optional().or(z.literal("")),
  vehicleModel: z.string().trim().max(60).optional().or(z.literal("")),
  vehiclePlate: z.string().trim().max(20).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (body.bookingDate < todayDateOnly()) {
    return NextResponse.json({ error: "La fecha ya pasó" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, name, active")
    .eq("id", body.serviceId)
    .maybeSingle();
  if (!service || !service.active) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 400 });
  }

  await expireStaleBookings(supabase);
  const availableSlots = await getAvailableSlots(supabase, body.bookingDate);
  if (!availableSlots.includes(body.bookingTime)) {
    return NextResponse.json({ error: "Ese horario ya no está disponible" }, { status: 409 });
  }

  const { data: depositSetting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "deposit_amount_clp")
    .maybeSingle();
  const depositAmountClp = Number(depositSetting?.value ?? 10000);

  const expiresAt = new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000).toISOString();

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      service_id: body.serviceId,
      booking_date: body.bookingDate,
      booking_time: body.bookingTime,
      status: "pending_payment",
      customer_name: body.customerName,
      customer_phone: body.customerPhone,
      customer_email: body.customerEmail,
      vehicle_make: body.vehicleMake || null,
      vehicle_model: body.vehicleModel || null,
      vehicle_plate: body.vehiclePlate || null,
      deposit_amount_clp: depositAmountClp,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    // 23505 = unique_violation -> another customer grabbed the slot first.
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "Ese horario ya no está disponible" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear la reserva" }, { status: 500 });
  }

  try {
    const preference = await createBookingPreference({
      bookingId: booking.id,
      serviceName: service.name,
      depositAmountClp,
      customerEmail: body.customerEmail,
    });

    await supabase
      .from("bookings")
      .update({ mp_preference_id: preference.id })
      .eq("id", booking.id);

    const isSandbox = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").startsWith("TEST-");
    const checkoutUrl = isSandbox ? preference.sandbox_init_point : preference.init_point;

    return NextResponse.json({ bookingId: booking.id, checkoutUrl });
  } catch (err) {
    // Preference creation failed after the row was created — cancel the
    // hold so the slot doesn't stay stuck for BOOKING_HOLD_MINUTES.
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    console.error("[bookings] error creando preferencia de Mercado Pago", err);
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 502 });
  }
}
