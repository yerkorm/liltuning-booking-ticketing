import type { Service } from "@/lib/services";
import { CalendarIcon, ClockIcon, SpeakerIcon, TicketIcon } from "./icons";

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function BookingSummary({
  service,
  date,
  time,
  depositAmountClp,
}: {
  service: Service | null;
  date: string | null;
  time: string | null;
  depositAmountClp: number;
}) {
  if (!service) {
    return (
      <div className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-400">
        Elige un servicio para empezar tu reserva.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-6">
      <p className="heading-condensed text-xs text-brand-red mb-4">Tu reserva</p>

      <div className="space-y-4">
        <SummaryRow icon={<SpeakerIcon className="h-5 w-5" />} label="Servicio" value={service.name} />
        {date && (
          <SummaryRow icon={<CalendarIcon className="h-5 w-5" />} label="Fecha" value={formatDateLabel(date)} />
        )}
        {time && <SummaryRow icon={<ClockIcon className="h-5 w-5" />} label="Hora" value={`${time} hrs`} />}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-sm bg-neutral-50 border border-neutral-200 p-4">
        <TicketIcon className="h-5 w-5 shrink-0 text-brand-red" />
        <div>
          <p className="text-xs text-neutral-500">Abono para confirmar</p>
          <p className="heading-condensed text-lg">${depositAmountClp.toLocaleString("es-CL")}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-400">El resto del servicio se paga presencialmente en el local.</p>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-brand-red">{icon}</span>
      <div>
        <p className="text-xs text-neutral-400">{label}</p>
        <p className="text-sm font-medium text-brand-black">{value}</p>
      </div>
    </div>
  );
}
