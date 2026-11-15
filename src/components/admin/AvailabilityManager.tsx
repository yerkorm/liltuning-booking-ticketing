"use client";

import { useState, useTransition } from "react";
import { DAY_NAMES_ES } from "@/lib/constants";
import {
  createAvailabilityRule,
  toggleAvailabilityRule,
  deleteAvailabilityRule,
  addClosedDate,
  deleteClosedDate,
} from "@/app/admin/(dashboard)/disponibilidad/actions";

interface Rule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  active: boolean;
}

interface ClosedDate {
  id: string;
  date: string;
  reason: string | null;
}

export function AvailabilityManager({
  rules,
  closedDates,
}: {
  rules: Rule[];
  closedDates: ClosedDate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [newRule, setNewRule] = useState({
    dayOfWeek: "1",
    startTime: "09:30",
    endTime: "18:30",
    slotDurationMinutes: "60",
  });
  const [newClosed, setNewClosed] = useState({ date: "", reason: "" });
  const [error, setError] = useState<string | null>(null);

  const rulesByDay = Array.from({ length: 7 }, (_, day) => ({
    day,
    rules: rules.filter((r) => r.day_of_week === day),
  }));

  function handleAddRule() {
    setError(null);
    startTransition(async () => {
      try {
        await createAvailabilityRule({
          dayOfWeek: Number(newRule.dayOfWeek),
          startTime: newRule.startTime,
          endTime: newRule.endTime,
          slotDurationMinutes: Number(newRule.slotDurationMinutes),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al crear el bloque");
      }
    });
  }

  function handleAddClosed() {
    if (!newClosed.date) return;
    setError(null);
    startTransition(async () => {
      try {
        await addClosedDate(newClosed.date, newClosed.reason);
        setNewClosed({ date: "", reason: "" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al bloquear la fecha");
      }
    });
  }

  return (
    <div className="space-y-12">
      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div>
        <h2 className="heading-condensed text-lg mb-4">Horario semanal</h2>
        <div className="space-y-4">
          {rulesByDay.map(({ day, rules: dayRules }) => (
            <div key={day} className="border border-neutral-200 rounded-sm p-4">
              <p className="heading-condensed text-sm text-brand-red mb-2">{DAY_NAMES_ES[day]}</p>
              {dayRules.length === 0 ? (
                <p className="text-xs text-neutral-400">Sin bloques (día cerrado).</p>
              ) : (
                <ul className="space-y-2">
                  {dayRules.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 text-sm">
                      <span className={r.active ? "" : "line-through text-neutral-400"}>
                        {r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)} (bloques de{" "}
                        {r.slot_duration_minutes} min)
                      </span>
                      <button
                        disabled={isPending}
                        onClick={() =>
                          startTransition(() => toggleAvailabilityRule(r.id, !r.active))
                        }
                        className="text-xs text-neutral-500 hover:text-brand-red"
                      >
                        {r.active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => startTransition(() => deleteAvailabilityRule(r.id))}
                        className="text-xs text-neutral-400 hover:text-brand-red"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 border border-dashed border-neutral-300 rounded-sm p-4">
          <p className="heading-condensed text-xs text-neutral-500 mb-3">Agregar bloque</p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Día</span>
              <select
                value={newRule.dayOfWeek}
                onChange={(e) => setNewRule({ ...newRule, dayOfWeek: e.target.value })}
                className="input"
              >
                {DAY_NAMES_ES.map((name, i) => (
                  <option key={i} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Desde</span>
              <input
                type="time"
                value={newRule.startTime}
                onChange={(e) => setNewRule({ ...newRule, startTime: e.target.value })}
                className="input"
              />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Hasta</span>
              <input
                type="time"
                value={newRule.endTime}
                onChange={(e) => setNewRule({ ...newRule, endTime: e.target.value })}
                className="input"
              />
            </label>
            <label className="text-xs">
              <span className="block text-neutral-500 mb-1">Duración bloque (min)</span>
              <input
                type="number"
                min={15}
                step={15}
                value={newRule.slotDurationMinutes}
                onChange={(e) => setNewRule({ ...newRule, slotDurationMinutes: e.target.value })}
                className="input w-24"
              />
            </label>
            <button
              disabled={isPending}
              onClick={handleAddRule}
              className="rounded-sm bg-brand-black text-white px-4 py-2 text-xs heading-condensed"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="heading-condensed text-lg mb-4">Días bloqueados</h2>
        {closedDates.length === 0 ? (
          <p className="text-xs text-neutral-400 mb-4">No hay días bloqueados.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {closedDates.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <span>{c.date}</span>
                {c.reason && <span className="text-neutral-500">— {c.reason}</span>}
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteClosedDate(c.id))}
                  className="text-xs text-neutral-400 hover:text-brand-red"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border border-dashed border-neutral-300 rounded-sm p-4 flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Fecha</span>
            <input
              type="date"
              value={newClosed.date}
              onChange={(e) => setNewClosed({ ...newClosed, date: e.target.value })}
              className="input"
            />
          </label>
          <label className="text-xs">
            <span className="block text-neutral-500 mb-1">Motivo (opcional)</span>
            <input
              type="text"
              value={newClosed.reason}
              onChange={(e) => setNewClosed({ ...newClosed, reason: e.target.value })}
              className="input"
              placeholder="Feriado, vacaciones…"
            />
          </label>
          <button
            disabled={isPending || !newClosed.date}
            onClick={handleAddClosed}
            className="rounded-sm bg-brand-black text-white px-4 py-2 text-xs heading-condensed disabled:opacity-40"
          >
            Bloquear día
          </button>
        </div>
      </div>
    </div>
  );
}
