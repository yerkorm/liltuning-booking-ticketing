import type { TicketTypeRow } from "@/lib/database.types";

// Pure helper — safe to import from Client Components. Keep this out of
// lib/tickets.ts, which also exports server-only (next/headers-dependent)
// data fetchers; importing that file from a "use client" component would
// pull the server code into the client bundle and break the build.
export function remainingStock(ticketType: TicketTypeRow): number {
  return Math.max(0, ticketType.quantity_total - ticketType.quantity_sold);
}
