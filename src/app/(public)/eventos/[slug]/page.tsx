import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedEventBySlug } from "@/lib/tickets";
import { TicketPurchaseFlow } from "@/components/tickets/TicketPurchaseFlow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  return { title: event ? `${event.name} — LilTuning` : "Evento — LilTuning" };
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function EventoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      {event.image_url && (
        <div className="mb-8 overflow-hidden rounded-md bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element -- poster URL is arbitrary admin input, not a known image host */}
          <img src={event.image_url} alt={event.name} className="max-h-96 w-full object-cover" />
        </div>
      )}

      <p className="heading-condensed text-brand-red text-sm">{formatEventDate(event.starts_at)}</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl">{event.name}</h1>
      {event.venue && <p className="mt-2 text-neutral-500">{event.venue}</p>}
      {event.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-line text-neutral-700 leading-relaxed">
          {event.description}
        </p>
      )}

      {event.ticketTypes.length === 0 ? (
        <p className="mt-10 text-neutral-500">Las entradas para este evento aún no están disponibles.</p>
      ) : (
        <TicketPurchaseFlow event={event} ticketTypes={event.ticketTypes} />
      )}
    </section>
  );
}
