import { redirect } from "next/navigation";
import { getStaffProfile } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getStaffProfile();
  if (!profile) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar profile={profile} />
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
