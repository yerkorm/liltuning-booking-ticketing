import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Public, read-only status lookup for the booking confirmation page.
// The booking id (a UUID) acts as the access token — only exposes the
// minimum needed to render a confirmation screen, never customer PII.
export async function GET(_request: Request, ctx: RouteContext<"/api/bookings/[id]">) {
  const { id } = await ctx.params;
  const supabase = createServiceRoleClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, booking_date, booking_time, deposit_amount_clp, service_id")
    .eq("id", id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", booking.service_id)
    .maybeSingle();

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time,
    depositAmountClp: booking.deposit_amount_clp,
    serviceName: service?.name ?? "",
  });
}
