"use client";

import { useState, useTransition } from "react";
import { createService, updateService, toggleServiceActive } from "@/app/admin/(dashboard)/servicios/actions";
import type { Service } from "@/lib/services";

const EMPTY = { name: "", description: "", durationMinutes: "60" };

export function ServicesManager({ services }: { services: Service[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      durationMinutes: String(service.duration_minutes),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const input = {
          name: form.name.trim(),
          description: form.description.trim(),
          durationMinutes: Number(form.durationMinutes) || 60,
        };
        if (editingId) {
          await updateService(editingId, input);
        } else {
          await createService(input);
        }
        cancelEdit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div>
      {error && <p className="text-sm text-brand-red mb-4">{error}</p>}

      <div className="space-y-3 mb-8">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border border-neutral-200 rounded-sm p-4"
          >
            <div>
              <p className="heading-condensed">{s.name}</p>
              <p className="text-sm text-neutral-500">{s.description}</p>
              <p className="text-xs text-neutral-400 mt-1">{s.duration_minutes} min</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>
                {s.active ? "Activo" : "Inactivo"}
              </span>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => toggleServiceActive(s.id, !s.active))}
                className="text-xs text-neutral-500 hover:text-brand-red"
              >
                {s.active ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => startEdit(s)} className="text-xs text-brand-red">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-dashed border-neutral-300 rounded-sm p-5">
        <p className="heading-condensed text-sm mb-4">{editingId ? "Editar servicio" : "Nuevo servicio"}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs sm:col-span-2">
            <span className="block text-neutral-500 mb-1">Nombre</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
            />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className="block text-neutral-500 mb-1">Descripción</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={2}
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Duración (min)</span>
            <input
              type="number"
              min={15}
              step={15}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              className="input w-28"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            disabled={isPending || !form.name.trim()}
            onClick={handleSave}
            className="rounded-sm bg-brand-red text-white px-4 py-2 text-xs heading-condensed disabled:opacity-40"
          >
            {editingId ? "Guardar cambios" : "Crear servicio"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-xs text-neutral-500">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
