import { LinkButton } from "@/components/Button";
import { getActiveServices } from "@/lib/services";
import { getSiteSettings } from "@/lib/settings";

export default async function HomePage() {
  const [services, settings] = await Promise.all([getActiveServices(), getSiteSettings()]);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-black text-white">
        <div className="diagonal-stripes absolute inset-y-0 right-0 w-1/3 opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="heading-condensed text-brand-red text-sm sm:text-base">{settings.business_slogan}</p>
          <h1 className="heading-condensed mt-2 text-4xl sm:text-6xl font-semibold max-w-2xl">
            Sonido de otro nivel para tu auto
          </h1>
          <p className="mt-5 max-w-xl text-neutral-300">
            Instalación de audio, aislación acústica y subwoofers. Reserva tu hora online en minutos y
            asegura tu cupo con un abono.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LinkButton href="/reservar">Reservar hora</LinkButton>
            <LinkButton href="/servicios" variant="outline-white">Ver servicios</LinkButton>
          </div>
        </div>
      </section>

      {services.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="heading-condensed text-2xl sm:text-3xl">Servicios destacados</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 4).map((service) => (
              <div key={service.id} className="border border-neutral-200 p-6 rounded-sm">
                <h3 className="heading-condensed text-lg">{service.name}</h3>
                <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <LinkButton href="/servicios" variant="outline">Ver todos los servicios</LinkButton>
          </div>
        </section>
      )}

      <section className="bg-neutral-50 border-y border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 text-center">
          <h2 className="heading-condensed text-2xl sm:text-3xl">¿Listo para subir el volumen?</h2>
          <p className="mt-3 text-neutral-600 max-w-xl mx-auto">
            Elige tu servicio, agenda un horario disponible y confirma tu reserva con un abono de{" "}
            ${settings.deposit_amount_clp.toLocaleString("es-CL")} vía Mercado Pago.
          </p>
          <div className="mt-6">
            <LinkButton href="/reservar">Reservar hora</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
