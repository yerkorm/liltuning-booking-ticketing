"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/Button";

interface BookingInfo {
  id: string;
  status: string;
  bookingDate: string;
  bookingTime: string;
  depositAmountClp: number;
  serviceName: string;
}

export function BookingStatus({ bookingId }: { bookingId: string }) {
  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setInfo(data);
        if (data.status === "pending_payment") {
          timer = setTimeout(poll, 3000);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, 3000);
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bookingId]);

  if (notFound) {
    return (
      <div className="text-center">
        <p className="text-neutral-600">No encontramos esa reserva.</p>
        <div className="mt-6">
          <LinkButton href="/reservar">Volver a reservar</LinkButton>
        </div>
      </div>
    );
  }

  if (!info) {
    return <p className="text-center text-neutral-500">Cargando…</p>;
  }

  if (info.status === "confirmed") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 text-3xl">
          ✓
        </div>
        <h2 className="heading-condensed text-2xl mt-4">¡Reserva confirmada!</h2>
        <dl className="mt-6 space-y-1 text-neutral-700">
          <p>{info.serviceName}</p>
          <p>
            {info.bookingDate} — {info.bookingTime}hrs
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Abono pagado: ${info.depositAmountClp.toLocaleString("es-CL")}
          </p>
        </dl>
        <p className="mt-4 text-sm text-neutral-500">
          El resto del servicio se paga presencialmente en el local. Te esperamos.
        </p>
      </div>
    );
  }

  if (info.status === "pending_payment") {
    return (
      <div className="text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-brand-red border-t-transparent animate-spin" />
        <h2 className="heading-condensed text-xl mt-4">Confirmando tu pago…</h2>
        <p className="mt-2 text-sm text-neutral-500">Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="heading-condensed text-2xl">El pago no se completó</h2>
      <p className="mt-2 text-neutral-600">
        Tu horario ya no está reservado. Puedes intentar de nuevo cuando quieras.
      </p>
      <div className="mt-6">
        <LinkButton href="/reservar">Intentar de nuevo</LinkButton>
      </div>
    </div>
  );
}
