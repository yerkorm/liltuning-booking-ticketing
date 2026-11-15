import { CheckIcon } from "./icons";

const STEPS = [
  { key: "servicio", label: "Servicio" },
  { key: "horario", label: "Horario" },
  { key: "datos", label: "Tus datos" },
] as const;

export function StepProgress({ current }: { current: "servicio" | "horario" | "datos" }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center">
      {STEPS.map((s, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                  state === "done"
                    ? "bg-brand-red text-white"
                    : state === "current"
                      ? "bg-brand-black text-white ring-4 ring-brand-red/15"
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {state === "done" ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={`hidden text-xs heading-condensed sm:inline transition-colors duration-300 ${
                  state === "upcoming" ? "text-neutral-400" : "text-brand-black"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="mx-3 h-px flex-1 bg-neutral-200 relative overflow-hidden sm:mx-4">
                <span
                  className={`absolute inset-y-0 left-0 bg-brand-red transition-all duration-500 ${
                    state === "done" ? "w-full" : "w-0"
                  }`}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
