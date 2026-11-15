import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedEvents } from "@/lib/tickets";

export const metadata: Metadata = { title: "Eventos — LilTuning" };

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

export default async function EventosPage() {
  const events = await getPublishedEvents();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="heading-condensed text-brand-red text-sm">Eventos</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl">Próximos eventos</h1>
      <p className="mt-4 text-neutral-600 max-w-2xl">
        Compra tu entrada online y muéstrala en la puerta el día del evento.
      </p>

      {events.length === 0 ? (
        <p className="mt-10 text-neutral-500">Por ahora no hay eventos publicados. Vuelve pronto.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.slug}`}
              className="group overflow-hidden rounded-md border border-neutral-200 transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/9] bg-neutral-100">
                {event.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- poster URL is arbitrary admin input, not a known image host
                  <img src={event.image_url} alt={event.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    <span className="heading-condensed text-sm">LILTUNING</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-wide text-brand-red">
                  {formatEventDate(event.starts_at)}
                </p>
                <h2 className="heading-condensed mt-1 text-xl group-hover:text-brand-red">{event.name}</h2>
                {event.venue && <p className="mt-1 text-sm text-neutral-500">{event.venue}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
