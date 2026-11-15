"use client";

import { useState, useTransition } from "react";
import {
  createTicketType,
  updateTicketType,
  toggleTicketTypeActive,
  type TicketTypeInput,
} from "@/app/admin/(dashboard)/eventos/actions";
import type { TicketTypeRow } from "@/lib/database.types";

const EMPTY: TicketTypeInput = { name: "", priceClp: 0, quantityTotal: 0, maxPerOrder: 10 };

export function TicketTypesManager({
  eventId,
  ticketTypes,
  soldByType,
}: {
  eventId: string;
  ticketTypes: TicketTypeRow[];
  soldByType: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TicketTypeInput>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(tt: TicketTypeRow) {
    setEditingId(tt.id);
    setForm({
      name: tt.name,
      priceClp: tt.price_clp,
      quantityTotal: tt.quantity_total,
      maxPerOrder: tt.max_per_order,
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(false);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateTicketType(eventId, editingId, form);
        } else {
          await createTicketType(eventId, form);
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

      <div className="space-y-3 mb-6">
        {ticketTypes.length === 0 && <p className="text-sm text-neutral-500">Sin tipos de entrada todavía.</p>}
        {ticketTypes.map((tt) => (
          <div key={tt.id} className="flex items-center justify-between border border-neutral-200 rounded-sm p-4">
            <div>
              <p className="heading-condensed">{tt.name}</p>
              <p className="text-sm text-neutral-500">
                ${tt.price_clp.toLocaleString("es-CL")} · {tt.quantity_sold}/{tt.quantity_total} reservadas ·{" "}
                {soldByType[tt.id] ?? 0} vendidas (pagadas)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full ${tt.active ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}>
                {tt.active ? "Activo" : "Inactivo"}
              </span>
              <button
                disabled={isPending}
                onClick={() => startTransition(() => toggleTicketTypeActive(eventId, tt.id, !tt.active))}
                className="text-xs text-neutral-500 hover:text-brand-red"
              >
                {tt.active ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => startEdit(tt)} className="text-xs text-brand-red">
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-sm bg-brand-black text-white px-4 py-2 text-xs heading-condensed"
        >
          + Tipo de entrada
        </button>
      ) : (
        <div className="border border-dashed border-neutral-300 rounded-sm p-5">
          <p className="heading-condensed text-sm mb-4">{editingId ? "Editar tipo de entrada" : "Nuevo tipo de entrada"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs sm:col-span-2">
              <span className="block text-neutral-500 mb-1">Nombre</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Precio (CLP)</span>
              <input
                type="number"
                min={0}
                step={500}
                value={form.priceClp}
                onChange={(e) => setForm({ ...form, priceClp: Number(e.target.value) })}
                className="input"
              />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Cupo total</span>
              <input
                type="number"
                min={0}
                value={form.quantityTotal}
                onChange={(e) => setForm({ ...form, quantityTotal: Number(e.target.value) })}
                className="input"
              />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Máximo por compra</span>
              <input
                type="number"
                min={1}
                value={form.maxPerOrder}
                onChange={(e) => setForm({ ...form, maxPerOrder: Number(e.target.value) })}
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
              {editingId ? "Guardar cambios" : "Crear"}
            </button>
            <button onClick={cancelEdit} className="text-xs text-neutral-500">
              Cancelar
            </button>
          </div>
          {editingId && (
            <p className="mt-3 text-xs text-neutral-400">
              Bajar el cupo total no cancela entradas ya vendidas; solo limita cuántas más se pueden vender.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
