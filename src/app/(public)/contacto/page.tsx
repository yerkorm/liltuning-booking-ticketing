import type { Metadata } from "next";
import { LinkButton } from "@/components/Button";
import { getSiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/format";

export const metadata: Metadata = { title: "Contacto — LilTuning" };

export default async function ContactoPage() {
  const settings = await getSiteSettings();

  const items = [
    { label: "Teléfono", value: settings.contact_phone, href: null as string | null },
    {
      label: "WhatsApp",
      value: settings.contact_whatsapp,
      href: settings.contact_whatsapp ? whatsappLink(settings.contact_whatsapp) : null,
    },
    { label: "Correo", value: settings.contact_email, href: settings.contact_email ? `mailto:${settings.contact_email}` : null },
    { label: "Dirección", value: settings.contact_address, href: null },
  ].filter((i) => i.value);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="heading-condensed text-brand-red text-sm">Contacto</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl">Hablemos</h1>
      <p className="mt-4 text-neutral-600 max-w-xl">
        Escríbenos o agenda tu hora directamente online.
      </p>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <div>
          {items.length === 0 ? (
            <p className="text-neutral-500">
              Datos de contacto pendientes de configurar (Admin -&gt; Configuración).
            </p>
          ) : (
            <dl className="space-y-4">
              {items.map((item) => (
                <div key={item.label}>
                  <dt className="heading-condensed text-xs text-brand-red">{item.label}</dt>
                  <dd className="text-neutral-800">
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red">
                        {item.value}
                      </a>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {(settings.social_instagram || settings.social_facebook) && (
            <div className="mt-8 flex gap-4">
              {settings.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="heading-condensed text-sm border-b-2 border-brand-red"
                >
                  Instagram
                </a>
              )}
              {settings.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="heading-condensed text-sm border-b-2 border-brand-red"
                >
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-8 text-center">
          <h2 className="heading-condensed text-xl">¿Prefieres agendar directo?</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Reserva tu hora online y confirma con el abono.
          </p>
          <div className="mt-6">
            <LinkButton href="/reservar">Reservar hora</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
