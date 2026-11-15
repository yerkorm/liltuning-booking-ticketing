import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";
import { getActiveServices } from "@/lib/services";

export const metadata: Metadata = { title: "Servicios — LilTuning" };

export default async function ServiciosPage() {
  const services = await getActiveServices();

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="heading-condensed text-brand-red text-sm">Servicios</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl">Qué hacemos</h1>
      <p className="mt-4 text-neutral-600 max-w-2xl">
        Catálogo de servicios de audio para autos. Elige el que necesitas y agenda tu hora online.
      </p>

      {services.length === 0 ? (
        <p className="mt-10 text-neutral-500">
          Aún no hay servicios publicados. Configúralos desde Admin -&gt; Servicios.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flex flex-col justify-between border border-neutral-200 p-6 rounded-sm"
            >
              <div>
                <h2 className="heading-condensed text-xl">{service.name}</h2>
                <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-neutral-400">
                  Duración aprox. {service.duration_minutes} min
                </p>
              </div>
              <div className="mt-6">
                <LinkButton href={`/reservar?servicio=${service.slug}`} variant="outline">
                  Reservar este servicio
                </LinkButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
