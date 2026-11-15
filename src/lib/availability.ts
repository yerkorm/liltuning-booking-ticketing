import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Parses "YYYY-MM-DD" as a local calendar date (avoids UTC off-by-one).
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayDateOnly(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

// All slots the schedule allows for that date, ignoring existing bookings.
export async function getScheduledSlots(
  supabase: Client,
  dateStr: string
): Promise<string[]> {
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getDay();

  const { data: closed } = await supabase
    .from("closed_dates")
    .select("date")
    .eq("date", dateStr)
    .maybeSingle();
  if (closed) return [];

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("start_time, end_time, slot_duration_minutes")
    .eq("day_of_week", dayOfWeek)
    .eq("active", true);

  const slots: string[] = [];
  for (const rule of rules ?? []) {
    const start = timeToMinutes(rule.start_time.slice(0, 5));
    const end = timeToMinutes(rule.end_time.slice(0, 5));
    for (let t = start; t + rule.slot_duration_minutes <= end; t += rule.slot_duration_minutes) {
      slots.push(minutesToTime(t));
    }
  }
  return slots.sort();
}

// Scheduled slots minus whatever is already held/confirmed for that date.
// Call expireStaleBookings() first so abandoned holds don't block real slots.
export async function getAvailableSlots(
  supabase: Client,
  dateStr: string
): Promise<string[]> {
  const allSlots = await getScheduledSlots(supabase, dateStr);
  if (allSlots.length === 0) return [];

  const { data: taken } = await supabase
    .from("bookings")
    .select("booking_time")
    .eq("booking_date", dateStr)
    .in("status", ["pending_payment", "confirmed"]);

  const takenTimes = new Set((taken ?? []).map((b) => b.booking_time.slice(0, 5)));
  return allSlots.filter((s) => !takenTimes.has(s));
}

export async function expireStaleBookings(supabase: Client): Promise<void> {
  await supabase.rpc("expire_stale_bookings");
}
