import { CarIcon, UserIcon } from "./icons";

export interface CustomerForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
}

export function DetailsStep({
  form,
  onChange,
  error,
  submitting,
  canSubmit,
  onSubmit,
}: {
  form: CustomerForm;
  onChange: (form: CustomerForm) => void;
  error: string | null;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  function set<K extends keyof CustomerForm>(key: K, value: string) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div>
      <h2 className="heading-condensed text-2xl">Tus datos</h2>
      <p className="mt-1 text-sm text-neutral-500">Los usamos solo para confirmar tu reserva.</p>

      <div className="mt-6 rounded-md border border-neutral-200 p-5">
        <p className="heading-condensed text-xs text-brand-red mb-4 flex items-center gap-1.5">
          <UserIcon className="h-4 w-4" /> Contacto
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo *">
            <input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} className="input" />
          </Field>
          <Field label="Teléfono *">
            <input
              value={form.customerPhone}
              onChange={(e) => set("customerPhone", e.target.value)}
              className="input"
              placeholder="+56 9 1234 5678"
            />
          </Field>
          <Field label="Correo *" className="sm:col-span-2">
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => set("customerEmail", e.target.value)}
              className="input"
            />
          </Field>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-neutral-200 p-5">
        <p className="heading-condensed text-xs text-brand-red mb-4 flex items-center gap-1.5">
          <CarIcon className="h-4 w-4" /> Vehículo <span className="text-neutral-400 normal-case">(opcional)</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca">
            <input value={form.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} className="input" />
          </Field>
          <Field label="Modelo">
            <input value={form.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} className="input" />
          </Field>
          <Field label="Patente">
            <input value={form.vehiclePlate} onChange={(e) => set("vehiclePlate", e.target.value)} className="input" />
          </Field>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

      <button
        disabled={!canSubmit || submitting}
        onClick={onSubmit}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-brand-red px-6 py-3.5 font-heading uppercase tracking-wide text-sm text-white transition-colors hover:bg-brand-red-hover disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {submitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Redirigiendo a Mercado Pago…
          </>
        ) : (
          "Ir a pagar el abono"
        )}
      </button>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block text-xs heading-condensed text-neutral-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
