import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { expireStaleBookings, getAvailableSlots, todayDateOnly } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const dateStr = request.nextUrl.searchParams.get("date");
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json({ error: "Parámetro 'date' inválido (YYYY-MM-DD)" }, { status: 400 });
  }
  if (dateStr < todayDateOnly()) {
    return NextResponse.json({ slots: [] });
  }

  const supabase = createServiceRoleClient();
  await expireStaleBookings(supabase);
  const slots = await getAvailableSlots(supabase, dateStr);

  return NextResponse.json({ slots });
}
