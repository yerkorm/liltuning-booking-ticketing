import { createServiceRoleClient } from "@/lib/supabase/server";

export interface SiteSettings {
  deposit_amount_clp: number;
  business_name: string;
  business_slogan: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_address: string;
  social_instagram: string;
  social_facebook: string;
  about_content: string;
}

const DEFAULTS: SiteSettings = {
  deposit_amount_clp: 10000,
  business_name: "LilTuning",
  business_slogan: "CAR AUDIO FOR FANATICS",
  contact_phone: "+56 9 0000 0000",
  contact_whatsapp: "+56900000000",
  contact_email: "",
  contact_address: "",
  social_instagram: "https://www.instagram.com/liltuning/",
  social_facebook: "",
  about_content: "",
};

// Server-only. Reads the whole site_settings key/value table (public
// content, safe to call from Server Components rendering public pages).
// Falls back to DEFAULTS if Supabase isn't configured/reachable yet, so the
// public site still renders (with placeholder content) during setup.
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) throw error;

    const settings = { ...DEFAULTS };
    for (const row of data ?? []) {
      if (row.key in settings) {
        // @ts-expect-error - value is jsonb, shape validated by key membership above
        settings[row.key as keyof SiteSettings] = row.value;
      }
    }
    return settings;
  } catch (err) {
    console.error("[settings] no se pudo leer site_settings, usando valores por defecto", err);
    return { ...DEFAULTS };
  }
}
