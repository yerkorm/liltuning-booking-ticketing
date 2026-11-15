"use client";

import { useMemo, useState } from "react";
import type { EventRow, TicketTypeRow } from "@/lib/database.types";
import { remainingStock } from "@/lib/ticket-utils";
import { ChevronLeftIcon, TicketIcon, UserIcon } from "@/components/booking/icons";

interface BuyerForm {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

const EMPTY_FORM: BuyerForm = { buyerName: "", buyerEmail: "", buyerPhone: "" };

export function TicketPurchaseFlow({ event, ticketTypes }: { event: EventRow; ticketTypes: TicketTypeRow[] }) {
  const [step, setStep] = useState<"entradas" | "datos">("entradas");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<BuyerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItems = useMemo(
    () =>
      ticketTypes
        .map((tt) => ({ ticketType: tt, quantity: quantities[tt.id] ?? 0 }))
        .filter((i) => i.quantity > 0),
    [ticketTypes, quantities]
  );
  const totalClp = selectedItems.reduce((sum, i) => sum + i.ticketType.price_clp * i.quantity, 0);
  const totalTickets = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  const canSubmit =
    form.buyerName.trim().length >= 2 &&
    form.buyerPhone.trim().length >= 6 &&
    /\S+@\S+\.\S+/.test(form.buyerEmail);

  function setQty(ticketTypeId: string, qty: number, max: number) {
    setQuantities((q) => ({ ...q, [ticketTypeId]: Math.max(0, Math.min(qty, max)) }));
  }

  async function handleSubmit() {
    if (submitting || selectedItems.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ticket-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          items: selectedItems.map((i) => ({ ticketTypeId: i.ticketType.id, quantity: i.quantity })),
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar la compra. Intenta de nuevo.");
        if (res.status === 409) setStep("entradas");
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="order-2 lg:order-1">
        {step === "datos" && (
          <button
            onClick={() => setStep("entradas")}
            className="mb-5 flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-red"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" /> Atrás
          </button>
        )}

        {step === "entradas" ? (
          <div>
            <h2 className="heading-condensed text-xl">Elige tus entradas</h2>
            <div className="mt-5 space-y-3">
              {ticketTypes.map((tt) => {
                const remaining = remainingStock(tt);
                const soldOut = remaining === 0;
                const max = Math.min(remaining, tt.max_per_order);
                const qty = quantities[tt.id] ?? 0;
                return (
                  <div
                    key={tt.id}
                    className={`flex items-center justify-between gap-4 rounded-md border p-4 ${
                      soldOut ? "border-neutral-100 bg-neutral-50 opacity-60" : "border-neutral-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="heading-condensed">{tt.name}</p>
                      <p className="text-sm text-neutral-500">${tt.price_clp.toLocaleString("es-CL")}</p>
                      {soldOut ? (
                        <p className="mt-1 text-xs text-brand-red">Agotado</p>
                      ) : remaining <= 10 ? (
                        <p className="mt-1 text-xs text-amber-600">Quedan {remaining}</p>
                      ) : null}
                    </div>

                    {!soldOut && (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          onClick={() => setQty(tt.id, qty - 1, max)}
                          disabled={qty === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-lg leading-none disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-medium">{qty}</span>
                        <button
                          onClick={() => setQty(tt.id, qty + 1, max)}
                          disabled={qty >= max}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-lg leading-none disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              disabled={totalTickets === 0}
              onClick={() => setStep("datos")}
              className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-brand-red px-6 py-3.5 font-heading uppercase tracking-wide text-sm text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              Continuar
            </button>
          </div>
        ) : (
          <div>
            <h2 className="heading-condensed text-xl">Tus datos</h2>
            <p className="mt-1 text-sm text-neutral-500">Aquí llegará la confirmación de tu compra.</p>

            <div className="mt-6 rounded-md border border-neutral-200 p-5">
              <p className="heading-condensed text-xs text-brand-red mb-4 flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" /> Comprador
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="block text-xs heading-condensed text-neutral-500 mb-1">Nombre completo *</span>
                  <input
                    value={form.buyerName}
                    onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                    className="input"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block text-xs heading-condensed text-neutral-500 mb-1">Teléfono *</span>
                  <input
                    value={form.buyerPhone}
                    onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                    className="input"
                    placeholder="+56 9 1234 5678"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="block text-xs heading-condensed text-neutral-500 mb-1">Correo *</span>
                  <input
                    type="email"
                    value={form.buyerEmail}
                    onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

            <button
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-brand-red px-6 py-3.5 font-heading uppercase tracking-wide text-sm text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Redirigiendo a Mercado Pago…
                </>
              ) : (
                "Pagar con Mercado Pago"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-md border border-neutral-200 bg-white p-6">
          <p className="heading-condensed text-xs text-brand-red mb-4">Tu compra</p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-neutral-400">Elige al menos una entrada.</p>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((i) => (
                <div key={i.ticketType.id} className="flex justify-between text-sm">
                  <span>
                    {i.quantity}× {i.ticketType.name}
                  </span>
                  <span className="font-medium">
                    ${(i.ticketType.price_clp * i.quantity).toLocaleString("es-CL")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 flex items-center gap-3 rounded-sm bg-neutral-50 border border-neutral-200 p-4">
            <TicketIcon className="h-5 w-5 shrink-0 text-brand-red" />
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              <p className="heading-condensed text-lg">${totalClp.toLocaleString("es-CL")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
