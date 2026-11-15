"use client";

import { useState, useTransition } from "react";
import { updateSiteSettings } from "@/app/admin/(dashboard)/configuracion/actions";
import type { SiteSettings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState<SiteSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function field<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateSiteSettings(form);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h2 className="heading-condensed text-lg mb-4">Reserva</h2>
        <label className="text-xs block max-w-xs">
          <span className="block text-neutral-500 mb-1">Monto del abono (CLP)</span>
          <input
            type="number"
            min={0}
            step={500}
            value={form.deposit_amount_clp}
            onChange={(e) => field("deposit_amount_clp", Number(e.target.value))}
            className="input"
          />
        </label>
      </section>

      <section>
        <h2 className="heading-condensed text-lg mb-4">Empresa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Nombre</span>
            <input
              value={form.business_name}
              onChange={(e) => field("business_name", e.target.value)}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Eslogan</span>
            <input
              value={form.business_slogan}
              onChange={(e) => field("business_slogan", e.target.value)}
              className="input"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="block text-neutral-500 mb-1">Texto &quot;Nosotros&quot;</span>
            <textarea
              value={form.about_content}
              onChange={(e) => field("about_content", e.target.value)}
              className="input"
              rows={4}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="heading-condensed text-lg mb-4">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Teléfono</span>
            <input
              value={form.contact_phone}
              onChange={(e) => field("contact_phone", e.target.value)}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">WhatsApp</span>
            <input
              value={form.contact_whatsapp}
              onChange={(e) => field("contact_whatsapp", e.target.value)}
              className="input"
              placeholder="+56912345678"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Correo</span>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => field("contact_email", e.target.value)}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Dirección</span>
            <input
              value={form.contact_address}
              onChange={(e) => field("contact_address", e.target.value)}
              className="input"
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="heading-condensed text-lg mb-4">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Instagram (URL)</span>
            <input
              value={form.social_instagram}
              onChange={(e) => field("social_instagram", e.target.value)}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Facebook (URL)</span>
            <input
              value={form.social_facebook}
              onChange={(e) => field("social_facebook", e.target.value)}
              className="input"
            />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-brand-red">{error}</p>}
      {saved && !isPending && <p className="text-sm text-green-700">Guardado.</p>}

      <button
        disabled={isPending}
        onClick={handleSave}
        className="rounded-sm bg-brand-red text-white px-6 py-3 text-sm heading-condensed disabled:opacity-40"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}
