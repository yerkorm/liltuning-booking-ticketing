"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { LinkButton } from "./Button";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/servicios", label: "Servicios" },
  { href: "/eventos", label: "Eventos" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo priority />

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-heading uppercase text-sm tracking-wide transition-colors ${
                pathname === link.href ? "text-brand-red" : "text-brand-black hover:text-brand-red"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <LinkButton href="/reservar">Reservar hora</LinkButton>
        </div>

        <button
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex h-10 w-10 items-center justify-center"
        >
          <span className="sr-only">Menú</span>
          <div className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-6 bg-brand-black transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-brand-black transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 bg-brand-black transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-neutral-200 bg-white px-4 pb-4">
          <div className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`py-3 font-heading uppercase text-sm tracking-wide border-b border-neutral-100 ${
                  pathname === link.href ? "text-brand-red" : "text-brand-black"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <LinkButton href="/reservar" className="mt-4 w-full">
              Reservar hora
            </LinkButton>
          </div>
        </nav>
      )}
    </header>
  );
}
