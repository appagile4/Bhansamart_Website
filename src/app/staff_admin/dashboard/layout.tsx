import { Suspense } from "react";
import StaffAdminLayout from "@/components/admin/StaffAdminLayout";

/**
 * Persistent Staff Admin shell for every /staff_admin/dashboard page.
 * The shell reads usePathname(), which Next 16 (Cache Components) only allows inside <Suspense>
 * on dynamic routes such as /staff_admin/dashboard/vendors/[id].
 */
export default function StaffAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <StaffAdminLayout>{children}</StaffAdminLayout>
    </Suspense>
  );
}
