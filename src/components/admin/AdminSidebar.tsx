"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import type { StaffProfile } from "@/lib/auth";

const STAFF_LINKS = [
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/checkin", label: "Check-in" },
];

const SUPER_ADMIN_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/eventos", label: "Eventos" },
  { href: "/admin/equipo", label: "Equipo" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminSidebar({ profile }: { profile: StaffProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = profile.role === "super_admin" ? [...SUPER_ADMIN_LINKS, ...STAFF_LINKS] : STAFF_LINKS;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-brand-black text-white min-h-screen flex flex-col">
      <div className="p-6">
        <Logo variant="white" />
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block rounded-sm px-4 py-2.5 text-sm heading-condensed transition-colors ${
              pathname === link.href
                ? "bg-brand-red text-white"
                : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-neutral-800">
        <p className="text-sm text-neutral-300">{profile.fullName}</p>
        <p className="text-xs text-neutral-500 uppercase">
          {profile.role === "super_admin" ? "Super administrador" : "Atención a público"}
        </p>
        <button
          onClick={handleLogout}
          className="mt-3 text-xs text-neutral-400 hover:text-brand-red"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
