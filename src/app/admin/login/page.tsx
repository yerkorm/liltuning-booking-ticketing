import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

// No Next.js proxy/middleware in this project (see note in
// src/lib/supabase/server.ts) — this redirect-if-already-logged-in check
// and the guard in admin/(dashboard)/layout.tsx are what /admin/* auth
// relies on instead.
export default async function AdminLoginPage() {
  const profile = await getStaffProfile();
  if (profile) redirect("/admin");

  return <LoginForm />;
}
