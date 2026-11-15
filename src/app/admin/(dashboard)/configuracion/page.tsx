import { requireSuperAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function ConfiguracionPage() {
  await requireSuperAdmin();
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Configuración</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
