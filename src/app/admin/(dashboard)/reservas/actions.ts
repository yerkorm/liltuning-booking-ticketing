"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffProfile } from "@/lib/auth";
import type { BookingStatus } from "@/lib/database.types";

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const profile = await getStaffProfile();
  if (!profile) throw new Error("No autorizado");

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reservas");
}

export async function assignStaff(bookingId: string, staffId: string | null) {
  const profile = await getStaffProfile();
  if (!profile) throw new Error("No autorizado");

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ assigned_staff_id: staffId })
    .eq("id", bookingId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reservas");
}

export async function updateStaffNotes(bookingId: string, notes: string) {
  const profile = await getStaffProfile();
  if (!profile) throw new Error("No autorizado");

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ staff_notes: notes }).eq("id", bookingId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/reservas");
}
