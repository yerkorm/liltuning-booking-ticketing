import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TeamManager } from "@/components/admin/TeamManager";

export default async function EquipoPage() {
  const profile = await requireSuperAdmin();
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("staff_users")
    .select("id, full_name, role, active")
    .order("full_name", { ascending: true });

  return (
    <div>
      <h1 className="heading-condensed text-2xl mb-6">Equipo</h1>
      <TeamManager members={members ?? []} currentUserId={profile.id} />
    </div>
  );
}
