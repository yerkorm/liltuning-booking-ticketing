import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/database.types";

export interface StaffProfile {
  id: string;
  fullName: string;
  role: StaffRole;
  email: string | null;
}

// Server-only. Returns the logged-in staff/admin's profile, or null if
// there's no session or the auth user isn't (or is no longer) staff.
export async function getStaffProfile(): Promise<StaffProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("staff_users")
    .select("id, full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.active) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    email: user.email ?? null,
  };
}

// Guards super_admin-only pages. The (dashboard) layout already ensures
// there's a valid staff session; this narrows it further to super_admin,
// bouncing plain staff back to the general admin landing.
export async function requireSuperAdmin(): Promise<StaffProfile> {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "super_admin") redirect("/admin");
  return profile;
}
