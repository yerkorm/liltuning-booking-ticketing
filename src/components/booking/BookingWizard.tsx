"use client";

import { useEffect, useMemo, useState } from "react";
import type { Service } from "@/lib/services";
import { StepProgress } from "./StepProgress";
import { BookingSummary } from "./BookingSummary";
import { ServiceStep } from "./ServiceStep";
import { ScheduleStep } from "./ScheduleStep";
import { DetailsStep, type CustomerForm } from "./DetailsStep";
import { ChevronLeftIcon } from "./icons";

type Step = "servicio" | "horario" | "datos";

const EMPTY_FORM: CustomerForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  vehicleMake: "",
  vehicleModel: "",
  vehiclePlate: "",
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function maxDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingWizard({
  services,
  depositAmountClp,
  preselectedSlug,
}: {
  services: Service[];
  depositAmountClp: number;
  preselectedSlug?: string;
}) {
  const preselected = services.find((s) => s.slug === preselectedSlug) ?? null;

  const [step, setStep] = useState<Step>(preselected ? "horario" : "servicio");
  const [service, setService] = useState<Service | null>(preselected);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  // Which date `slots` currently reflects — while it doesn't match `date`,
  // we're between requests. Derived instead of a loading flag set
  // synchronously inside the effect (React frowns on setState-in-effect).
  const [slotsDate, setSlotsDate] = useState<string | null>(null);
  const slotsLoading = step === "horario" && slotsDate !== date;
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "horario") return;
    let cancelled = false;
    fetch(`/api/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSlots(data.slots ?? []);
        setSlotsDate(date);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setSlotsDate(date);
      });
    return () => {
      cancelled = true;
    };
  }, [date, step]);

  const canSubmit = useMemo(() => {
    return (
      form.customerName.trim().length >= 2 &&
      form.customerPhone.trim().length >= 6 &&
      /\S+@\S+\.\S+/.test(form.customerEmail)
    );
  }, [form]);

  async function handleSubmit() {
    if (!service || !time || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          bookingDate: date,
          bookingTime: time,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("Ese horario se acaba de reservar. Elige otro.");
          setStep("horario");
          setTime(null);
        } else {
          setError(data.error ?? "No se pudo crear la reserva. Intenta de nuevo.");
        }
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  const backTarget: Step | null = step === "horario" ? "servicio" : step === "datos" ? "horario" : null;

  return (
    <div>
      <StepProgress current={step} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          {backTarget && (
            <button
              onClick={() => setStep(backTarget)}
              className="mb-5 flex items-center gap-1 text-xs text-neutral-500 hover:text-brand-red"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" /> Atrás
            </button>
          )}

          <div key={step} className="animate-step-in">
            {step === "servicio" && (
              <ServiceStep
                services={services}
                selectedId={service?.id ?? null}
                onSelect={(s) => {
                  setService(s);
                  setTime(null);
                  setStep("horario");
                }}
              />
            )}

            {step === "horario" && service && (
              <>
                <ScheduleStep
                  date={date}
                  onDateChange={(d) => {
                    setDate(d);
                    setTime(null);
                  }}
                  time={time}
                  onTimeChange={setTime}
                  slots={slots}
                  slotsLoading={slotsLoading}
                  minDate={todayISO()}
                  maxDate={maxDateISO()}
                />
                <button
                  disabled={!time}
                  onClick={() => setStep("datos")}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-sm bg-brand-red px-6 py-3.5 font-heading uppercase tracking-wide text-sm text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  Continuar
                </button>
              </>
            )}

            {step === "datos" && service && time && (
              <DetailsStep
                form={form}
                onChange={setForm}
                error={error}
                submitting={submitting}
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <BookingSummary service={service} date={step === "servicio" ? null : date} time={time} depositAmountClp={depositAmountClp} />
        </div>
      </div>
    </div>
  );
}
