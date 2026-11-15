import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/auth";

export default async function AdminIndexPage() {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login");
  redirect(profile.role === "super_admin" ? "/admin/dashboard" : "/admin/reservas");
}
