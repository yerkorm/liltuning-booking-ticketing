import type { Metadata } from "next";
import { BookingStatus } from "@/components/booking/BookingStatus";

export const metadata: Metadata = { title: "Confirmación de reserva — LilTuning" };

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking } = await searchParams;

  return (
    <section className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      {booking ? (
        <BookingStatus bookingId={booking} />
      ) : (
        <p className="text-center text-neutral-500">Falta el identificador de la reserva.</p>
      )}
    </section>
  );
}
