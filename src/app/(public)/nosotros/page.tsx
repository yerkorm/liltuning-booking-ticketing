import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Nosotros — LilTuning" };

export default async function NosotrosPage() {
  const settings = await getSiteSettings();

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="heading-condensed text-brand-red text-sm">Nosotros</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl">{settings.business_name}</h1>
      <p className="mt-6 text-neutral-700 leading-relaxed whitespace-pre-line">
        {settings.about_content ||
          `Contenido de ejemplo: aquí va la historia de LilTuning — cómo partió, qué la distingue y por
qué los clientes confían en el taller para su equipo de audio. Reemplaza este texto desde
Admin -> Configuración cuando tengas el contenido definitivo.`}
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          { title: "Experiencia", body: "Años instalando equipos de audio para autos en Chile." },
          { title: "Calidad", body: "Trabajamos con marcas reconocidas y garantizamos la instalación." },
          { title: "Pasión", body: "Car audio for fanatics — para quienes viven el sonido al máximo." },
        ].map((item) => (
          <div key={item.title} className="border border-neutral-200 p-6 rounded-sm">
            <h3 className="heading-condensed text-lg text-brand-red">{item.title}</h3>
            <p className="mt-2 text-sm text-neutral-600">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <LinkButton href="/reservar">Reservar hora</LinkButton>
      </div>
    </section>
  );
}
