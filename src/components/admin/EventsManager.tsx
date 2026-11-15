"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createEvent, updateEventStatus, type EventInput } from "@/app/admin/(dashboard)/eventos/actions";
import type { EventRow, EventStatus } from "@/lib/database.types";

const EMPTY_FORM: EventInput = { name: "", description: "", venue: "", startsAt: "", imageUrl: "" };

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
};
const STATUS_COLOR: Record<EventStatus, string> = {
  draft: "bg-neutral-200 text-neutral-600",
  published: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
}

export function EventsManager({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createEvent(form);
        setForm(EMPTY_FORM);
        setShowForm(false);
        router.push(`/admin/eventos/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al crear el evento");
      }
    });
  }

  return (
    <div>
      {error && <p className="text-sm text-brand-red mb-4">{error}</p>}

      <div className="space-y-3 mb-8">
        {events.length === 0 && <p className="text-sm text-neutral-500">Aún no hay eventos.</p>}
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between border border-neutral-200 rounded-sm p-4">
            <div>
              <Link href={`/admin/eventos/${event.id}`} className="heading-condensed hover:text-brand-red">
                {event.name}
              </Link>
              <p className="text-sm text-neutral-500">{formatDate(event.starts_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[event.status]}`}>
                {STATUS_LABEL[event.status]}
              </span>
              {event.status !== "published" && (
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => updateEventStatus(event.id, "published"))}
                  className="text-xs text-green-700 hover:underline"
                >
                  Publicar
                </button>
              )}
              {event.status === "published" && (
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => updateEventStatus(event.id, "draft"))}
                  className="text-xs text-neutral-500 hover:underline"
                >
                  Despublicar
                </button>
              )}
              <Link href={`/admin/eventos/${event.id}`} className="text-xs text-brand-red">
                Gestionar
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-sm bg-brand-red text-white px-4 py-2 text-xs heading-condensed"
        >
          + Nuevo evento
        </button>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-sm p-5">
          <p className="heading-condensed text-sm mb-4">Nuevo evento</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs sm:col-span-2">
              <span className="block text-neutral-500 mb-1">Nombre</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Fecha y hora</span>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="input"
              />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Lugar</span>
              <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input" />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="block text-neutral-500 mb-1">Descripción</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={3}
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="block text-neutral-500 mb-1">URL de imagen/afiche (opcional)</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="input"
                placeholder="https://…"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              disabled={isPending || !form.name.trim() || !form.startsAt}
              onClick={handleCreate}
              className="rounded-sm bg-brand-red text-white px-4 py-2 text-xs heading-condensed disabled:opacity-40"
            >
              Crear evento
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-neutral-500">
              Cancelar
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            El evento se crea como borrador. Después de agregar tipos de entrada, publícalo desde la lista.
          </p>
        </div>
      )}
    </div>
  );
}
