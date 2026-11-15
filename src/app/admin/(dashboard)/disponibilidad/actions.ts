"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "@/lib/auth";

async function requireStaffClient() {
  const profile = await getStaffProfile();
  if (!profile) throw new Error("No autorizado");
  return createClient();
}

export async function createAvailabilityRule(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}) {
  const supabase = await requireStaffClient();
  const { error } = await supabase.from("availability_rules").insert({
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    slot_duration_minutes: input.slotDurationMinutes,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilidad");
}

export async function toggleAvailabilityRule(id: string, active: boolean) {
  const supabase = await requireStaffClient();
  const { error } = await supabase.from("availability_rules").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilidad");
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = await requireStaffClient();
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilidad");
}

export async function addClosedDate(date: string, reason: string) {
  const supabase = await requireStaffClient();
  const { error } = await supabase.from("closed_dates").insert({ date, reason: reason || null });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilidad");
}

export async function deleteClosedDate(id: string) {
  const supabase = await requireStaffClient();
  const { error } = await supabase.from("closed_dates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/disponibilidad");
}
