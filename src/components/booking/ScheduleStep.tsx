"use client";

import { useRef, useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, MoonIcon, SunIcon } from "./icons";

const DAY_ABBR = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDayStrip(daysAhead: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return { iso: toISO(d), dayAbbr: DAY_ABBR[d.getDay()], dayNum: d.getDate(), isToday: i === 0 };
  });
}

const STRIP = buildDayStrip(21);

export function ScheduleStep({
  date,
  onDateChange,
  time,
  onTimeChange,
  slots,
  slotsLoading,
  minDate,
  maxDate,
}: {
  date: string;
  onDateChange: (date: string) => void;
  time: string | null;
  onTimeChange: (time: string) => void;
  slots: string[];
  slotsLoading: boolean;
  minDate: string;
  maxDate: string;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const morning = slots.filter((s) => s < "14:00");
  const afternoon = slots.filter((s) => s >= "14:00");

  return (
    <div>
      <h2 className="heading-condensed text-2xl">Elige fecha y hora</h2>
      <p className="mt-1 text-sm text-neutral-500">Los horarios se actualizan según disponibilidad real.</p>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="heading-condensed text-xs text-neutral-500 flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4" /> Fecha
          </p>
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            className="text-xs text-brand-red hover:underline"
          >
            {showDatePicker ? "Ocultar calendario" : "Elegir otra fecha"}
          </button>
        </div>

        {showDatePicker && (
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="input mb-4 w-auto"
          />
        )}

        <div className="relative">
          <button
            aria-label="Ver fechas anteriores"
            onClick={() => scrollerRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 -translate-x-3 h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:text-brand-red sm:flex"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scroll-smooth [scrollbar-width:thin]"
          >
            {STRIP.map((d) => {
              const selected = d.iso === date;
              return (
                <button
                  key={d.iso}
                  onClick={() => onDateChange(d.iso)}
                  className={`relative flex w-16 shrink-0 snap-start flex-col items-center rounded-md border py-3 transition-colors ${
                    selected
                      ? "border-brand-red bg-brand-red text-white"
                      : "border-neutral-200 hover:border-brand-red text-brand-black"
                  }`}
                >
                  <span className={`text-[10px] tracking-wide ${selected ? "text-white/80" : "text-neutral-400"}`}>
                    {d.dayAbbr}
                  </span>
                  <span className="heading-condensed text-lg leading-tight">{d.dayNum}</span>
                  {d.isToday && (
                    <span className={`mt-1 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-brand-red"}`} />
                  )}
                </button>
              );
            })}
          </div>

          <button
            aria-label="Ver más fechas"
            onClick={() => scrollerRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-3 h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:text-brand-red sm:flex"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-8">
        <p className="heading-condensed text-xs text-neutral-500 mb-3 flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4" /> Horarios disponibles
        </p>

        {slotsLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-sm bg-neutral-100" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No hay horarios disponibles ese día. Prueba otra fecha.
          </div>
        ) : (
          <div className="space-y-5">
            {morning.length > 0 && (
              <SlotGroup icon={<SunIcon />} label="Mañana" slots={morning} time={time} onTimeChange={onTimeChange} />
            )}
            {afternoon.length > 0 && (
              <SlotGroup icon={<MoonIcon />} label="Tarde" slots={afternoon} time={time} onTimeChange={onTimeChange} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SlotGroup({
  icon,
  label,
  slots,
  time,
  onTimeChange,
}: {
  icon: React.ReactNode;
  label: string;
  slots: string[];
  time: string | null;
  onTimeChange: (time: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs text-neutral-400">
        {icon} {label}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => {
          const selected = time === s;
          return (
            <button
              key={s}
              onClick={() => onTimeChange(s)}
              className={`rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-neutral-200 hover:border-brand-red"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}
