"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import type { EventStatus } from "@/lib/database.types";

export interface EventInput {
  name: string;
  description: string;
  venue: string;
  startsAt: string; // ISO datetime-local value
  imageUrl: string;
}

export async function createEvent(input: EventInput) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: input.name,
      slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
      description: input.description,
      venue: input.venue,
      starts_at: new Date(input.startsAt).toISOString(),
      image_url: input.imageUrl || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  return data.id as string;
}

export async function updateEvent(id: string, input: EventInput) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      name: input.name,
      description: input.description,
      venue: input.venue,
      starts_at: new Date(input.startsAt).toISOString(),
      image_url: input.imageUrl || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${id}`);
  revalidatePath("/eventos");
}

export async function updateEventStatus(id: string, status: EventStatus) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/eventos");
  revalidatePath(`/admin/eventos/${id}`);
  revalidatePath("/eventos");
}

export interface TicketTypeInput {
  name: string;
  priceClp: number;
  quantityTotal: number;
  maxPerOrder: number;
}

export async function createTicketType(eventId: string, input: TicketTypeInput) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("ticket_types").insert({
    event_id: eventId,
    name: input.name,
    price_clp: input.priceClp,
    quantity_total: input.quantityTotal,
    max_per_order: input.maxPerOrder,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/eventos");
}

export async function updateTicketType(eventId: string, ticketTypeId: string, input: TicketTypeInput) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_types")
    .update({
      name: input.name,
      price_clp: input.priceClp,
      quantity_total: input.quantityTotal,
      max_per_order: input.maxPerOrder,
    })
    .eq("id", ticketTypeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/eventos");
}

export async function toggleTicketTypeActive(eventId: string, ticketTypeId: string, active: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("ticket_types").update({ active }).eq("id", ticketTypeId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/eventos/${eventId}`);
  revalidatePath("/eventos");
}
