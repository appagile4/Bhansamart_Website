import { Suspense } from "react";
import AdminLayout from "@/components/admin/AdminLayout";

/**
 * Persistent Super Admin shell for every /admin/dashboard page.
 * The shell reads usePathname(), which Next 16 (Cache Components) only allows inside <Suspense>
 * on dynamic routes such as /admin/dashboard/vendors/[id].
 */
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AdminLayout>{children}</AdminLayout>
    </Suspense>
  );
}
