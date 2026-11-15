import type { Metadata } from "next";
import { getActiveServices } from "@/lib/services";
import { getSiteSettings } from "@/lib/settings";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Reservar hora — LilTuning" };

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const [services, settings] = await Promise.all([getActiveServices(), getSiteSettings()]);

  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="heading-condensed text-brand-red text-sm text-center">Reservar hora</p>
      <h1 className="heading-condensed mt-2 text-3xl sm:text-5xl text-center">Agenda tu cita</h1>

      {services.length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">
          Aún no hay servicios publicados para reservar. Vuelve a intentarlo más tarde.
        </p>
      ) : (
        <div className="mt-12">
          <BookingWizard
            services={services}
            depositAmountClp={settings.deposit_amount_clp}
            preselectedSlug={servicio}
          />
        </div>
      )}
    </section>
  );
}
