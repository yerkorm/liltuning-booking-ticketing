"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/Button";

interface TicketInfo {
  id: string;
  code: string;
  typeName: string;
  qrSvg: string;
}

interface OrderInfo {
  id: string;
  status: string;
  totalAmountClp: number;
  buyerName: string;
  event: { name: string; slug: string; venue: string; startsAt: string } | null;
  tickets: TicketInfo[];
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function TicketOrderStatus({ orderId }: { orderId: string }) {
  const [info, setInfo] = useState<OrderInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/ticket-orders/${orderId}`);
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
  }, [orderId]);

  if (notFound) {
    return (
      <div className="text-center">
        <p className="text-neutral-600">No encontramos esa orden.</p>
        <div className="mt-6">
          <LinkButton href="/eventos">Ver eventos</LinkButton>
        </div>
      </div>
    );
  }

  if (!info) {
    return <p className="text-center text-neutral-500">Cargando…</p>;
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

  if (info.status !== "paid") {
    return (
      <div className="text-center">
        <h2 className="heading-condensed text-2xl">El pago no se completó</h2>
        <p className="mt-2 text-neutral-600">Tus entradas no fueron reservadas. Puedes intentar de nuevo.</p>
        <div className="mt-6">
          <LinkButton href={info.event ? `/eventos/${info.event.slug}` : "/eventos"}>
            Intentar de nuevo
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center print:hidden">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
          ✓
        </div>
        <h2 className="heading-condensed text-2xl mt-4">¡Compra confirmada!</h2>
        {info.event && (
          <p className="mt-2 text-neutral-600">
            {info.event.name} — {formatEventDate(info.event.startsAt)}
          </p>
        )}
        <button
          onClick={() => window.print()}
          className="mt-6 inline-flex items-center justify-center rounded-sm bg-brand-black px-6 py-3 font-heading uppercase tracking-wide text-sm text-white hover:bg-neutral-800"
        >
          Descargar / Imprimir entradas
        </button>
      </div>

      <div className="mt-10 space-y-6">
        {info.tickets.map((ticket, i) => (
          <div
            key={ticket.id}
            className="break-inside-avoid rounded-md border border-neutral-200 p-6 print:break-after-page"
          >
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <p className="heading-condensed text-xs text-brand-red">Entrada {i + 1}</p>
                <p className="heading-condensed text-xl mt-1">{info.event?.name}</p>
                <p className="text-sm text-neutral-500">{ticket.typeName}</p>
                {info.event && (
                  <p className="mt-2 text-sm text-neutral-600">
                    {formatEventDate(info.event.startsAt)}
                    {info.event.venue ? ` — ${info.event.venue}` : ""}
                  </p>
                )}
                <p className="mt-3 text-xs text-neutral-400">A nombre de {info.buyerName}</p>
                <p className="mt-1 font-mono text-sm tracking-wider">{ticket.code}</p>
              </div>
              <div
                className="shrink-0 [&_svg]:h-40 [&_svg]:w-40"
                dangerouslySetInnerHTML={{ __html: ticket.qrSvg }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
