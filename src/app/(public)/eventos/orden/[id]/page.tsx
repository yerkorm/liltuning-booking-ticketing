import type { Metadata } from "next";
import { TicketOrderStatus } from "@/components/tickets/TicketOrderStatus";

export const metadata: Metadata = { title: "Tu compra — LilTuning" };

export default async function OrdenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <TicketOrderStatus orderId={id} />
    </section>
  );
}
