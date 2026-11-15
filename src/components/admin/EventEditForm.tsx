"use client";

import { useState, useTransition } from "react";
import { updateEvent, type EventInput } from "@/app/admin/(dashboard)/eventos/actions";
import type { EventRow } from "@/lib/database.types";

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventEditForm({ event }: { event: EventRow }) {
  const [form, setForm] = useState<EventInput>({
    name: event.name,
    description: event.description,
    venue: event.venue,
    startsAt: toDatetimeLocal(event.starts_at),
    imageUrl: event.image_url ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateEvent(event.id, form);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="border border-neutral-200 rounded-sm p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs sm:col-span-2">
          <span className="block text-neutral-500 mb-1">Nombre</span>
          <input
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setSaved(false);
            }}
            className="input"
          />
        </label>
        <label className="text-xs">
          <span className="block text-neutral-500 mb-1">Fecha y hora</span>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => {
              setForm({ ...form, startsAt: e.target.value });
              setSaved(false);
            }}
            className="input"
          />
        </label>
        <label className="text-xs">
          <span className="block text-neutral-500 mb-1">Lugar</span>
          <input
            value={form.venue}
            onChange={(e) => {
              setForm({ ...form, venue: e.target.value });
              setSaved(false);
            }}
            className="input"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="block text-neutral-500 mb-1">Descripción</span>
          <textarea
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              setSaved(false);
            }}
            className="input"
            rows={3}
          />
        </label>
        <label className="text-xs sm:col-span-2">
          <span className="block text-neutral-500 mb-1">URL de imagen/afiche (opcional)</span>
          <input
            value={form.imageUrl}
            onChange={(e) => {
              setForm({ ...form, imageUrl: e.target.value });
              setSaved(false);
            }}
            className="input"
            placeholder="https://…"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}
      {saved && !isPending && <p className="mt-3 text-sm text-green-700">Guardado.</p>}

      <button
        disabled={isPending || !form.name.trim()}
        onClick={handleSave}
        className="mt-4 rounded-sm bg-brand-red text-white px-4 py-2 text-xs heading-condensed disabled:opacity-40"
      >
        Guardar cambios
      </button>
    </div>
  );
}
