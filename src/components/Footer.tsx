import Link from "next/link";
import { Logo } from "./Logo";
import type { SiteSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/format";

export function Footer({ settings }: { settings: SiteSettings }) {
  const hasSocials = settings.social_instagram || settings.social_facebook;
  const hasContact = settings.contact_phone || settings.contact_whatsapp || settings.contact_email;

  return (
    <footer className="bg-brand-black text-white mt-auto print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Logo variant="white" />
            <p className="mt-3 text-sm text-neutral-400">{settings.business_slogan}</p>
          </div>

          <div>
            <h3 className="heading-condensed text-sm text-brand-red">Navegación</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              <li><Link href="/nosotros" className="hover:text-white">Nosotros</Link></li>
              <li><Link href="/servicios" className="hover:text-white">Servicios</Link></li>
              <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
              <li><Link href="/reservar" className="hover:text-white">Reservar hora</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="heading-condensed text-sm text-brand-red">Contacto</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              {settings.contact_phone && <li>{settings.contact_phone}</li>}
              {settings.contact_whatsapp && (
                <li>
                  <a
                    href={whatsappLink(settings.contact_whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    WhatsApp: {settings.contact_whatsapp}
                  </a>
                </li>
              )}
              {settings.contact_email && <li>{settings.contact_email}</li>}
              {settings.contact_address && <li>{settings.contact_address}</li>}
              {!hasContact && (
                <li className="text-neutral-500">Datos de contacto pendientes de configurar.</li>
              )}
            </ul>
            {hasSocials && (
              <div className="mt-4 flex gap-4 text-sm">
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red">
                    Instagram
                  </a>
                )}
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-brand-red">
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
          © {new Date().getFullYear()} {settings.business_name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
