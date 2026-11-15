import type { Service } from "@/lib/services";
import { ChevronRightIcon, SpeakerIcon } from "./icons";

export function ServiceStep({
  services,
  selectedId,
  onSelect,
}: {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}) {
  return (
    <div>
      <h2 className="heading-condensed text-2xl">Elige un servicio</h2>
      <p className="mt-1 text-sm text-neutral-500">Selecciona lo que necesitas para tu auto.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {services.map((s) => {
          const selected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`group flex items-start gap-4 rounded-md border p-5 text-left transition-all duration-150 ${
                selected
                  ? "border-brand-red bg-red-50/40 ring-1 ring-brand-red"
                  : "border-neutral-200 hover:border-brand-red hover:shadow-sm"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  selected ? "bg-brand-red text-white" : "bg-neutral-100 text-brand-black group-hover:bg-brand-black group-hover:text-white"
                }`}
              >
                <SpeakerIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="heading-condensed leading-tight">{s.name}</p>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{s.description}</p>
                )}
                <p className="mt-2 text-xs uppercase tracking-wide text-neutral-400">
                  ~{s.duration_minutes} min
                </p>
              </div>
              <ChevronRightIcon
                className={`mt-1 h-4 w-4 shrink-0 transition-transform ${
                  selected ? "text-brand-red" : "text-neutral-300 group-hover:translate-x-0.5 group-hover:text-brand-red"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
