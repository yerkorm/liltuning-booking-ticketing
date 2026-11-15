"use client";

import { useTransition } from "react";
import type { BookingStatus } from "@/lib/database.types";
import { updateBookingStatus, assignStaff } from "@/app/admin/(dashboard)/reservas/actions";

export interface BookingRow {
  id: string;
  booking_time: string;
  status: BookingStatus;
  customer_name: string;
  customer_phone: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  deposit_amount_clp: number;
  assigned_staff_id: string | null;
  serviceName: string;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  completed: "Completada",
  no_show: "No se presentó",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const STATUS_COLOR: Record<BookingStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  no_show: "bg-neutral-200 text-neutral-600",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-neutral-200 text-neutral-500",
};

export function BookingsTable({
  bookings,
  staffOptions,
}: {
  bookings: BookingRow[];
  staffOptions: { id: string; full_name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  if (bookings.length === 0) {
    return <p className="text-neutral-500 text-sm">No hay reservas para esta fecha.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs heading-condensed text-neutral-500 border-b border-neutral-200">
            <th className="py-2 pr-4">Hora</th>
            <th className="py-2 pr-4">Cliente</th>
            <th className="py-2 pr-4">Servicio</th>
            <th className="py-2 pr-4">Vehículo</th>
            <th className="py-2 pr-4">Abono</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4">Asignado a</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-neutral-100 align-top">
              <td className="py-3 pr-4 font-medium">{b.booking_time.slice(0, 5)}</td>
              <td className="py-3 pr-4">
                <p>{b.customer_name}</p>
                <p className="text-xs text-neutral-500">{b.customer_phone}</p>
              </td>
              <td className="py-3 pr-4">{b.serviceName}</td>
              <td className="py-3 pr-4 text-xs text-neutral-600">
                {[b.vehicle_make, b.vehicle_model, b.vehicle_plate].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className="py-3 pr-4">${b.deposit_amount_clp.toLocaleString("es-CL")}</td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </div>
                {b.status === "confirmed" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => updateBookingStatus(b.id, "completed"))}
                      className="text-xs text-green-700 hover:underline"
                    >
                      Completada
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => updateBookingStatus(b.id, "no_show"))}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      No-show
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => updateBookingStatus(b.id, "cancelled"))}
                      className="text-xs text-brand-red hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </td>
              <td className="py-3 pr-4">
                <select
                  defaultValue={b.assigned_staff_id ?? ""}
                  disabled={isPending}
                  onChange={(e) =>
                    startTransition(() => assignStaff(b.id, e.target.value || null))
                  }
                  className="input text-xs py-1"
                >
                  <option value="">Sin asignar</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
