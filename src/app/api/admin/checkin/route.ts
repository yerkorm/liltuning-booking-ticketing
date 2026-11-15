import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStaffProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ code: z.string().trim().min(1) });

export async function POST(request: NextRequest) {
  const profile = await getStaffProfile();
  if (!profile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();

  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, status, used_at, ticket_type_id, event_id")
    .eq("code", code)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Código no válido", outcome: "not_found" }, { status: 404 });
  }

  const [{ data: ticketType }, { data: event }] = await Promise.all([
    supabase.from("ticket_types").select("name").eq("id", ticket.ticket_type_id).maybeSingle(),
    supabase.from("events").select("name").eq("id", ticket.event_id).maybeSingle(),
  ]);

  if (ticket.status === "cancelled") {
    return NextResponse.json(
      { error: "Esta entrada fue cancelada", outcome: "cancelled", eventName: event?.name, typeName: ticketType?.name },
      { status: 409 }
    );
  }

  if (ticket.status === "used") {
    return NextResponse.json(
      {
        error: `Ya fue usada${ticket.used_at ? ` a las ${new Date(ticket.used_at).toLocaleTimeString("es-CL")}` : ""}`,
        outcome: "already_used",
        eventName: event?.name,
        typeName: ticketType?.name,
      },
      { status: 409 }
    );
  }

  // Atomic compare-and-swap: only succeeds if it's still 'valid' at this
  // instant, so two simultaneous scans of the same ticket can't both pass.
  const { data: updated, error: updateError } = await supabase
    .from("tickets")
    .update({ status: "used", used_at: new Date().toISOString(), used_by_staff_id: profile.id })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Error al validar la entrada" }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "Ya fue usada (justo ahora)", outcome: "already_used", eventName: event?.name, typeName: ticketType?.name },
      { status: 409 }
    );
  }

  return NextResponse.json({
    ok: true,
    outcome: "valid",
    eventName: event?.name ?? "",
    typeName: ticketType?.name ?? "",
    code,
  });
}
