"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useStaffAdminSession } from "@/lib/admin/session";

/** /staff_admin → console when signed in as a staff admin, otherwise the staff admin login. */
export default function StaffAdminEntryPage() {
  const router = useRouter();
  const session = useStaffAdminSession();

  useEffect(() => {
    if (session === undefined) return; // still hydrating
    router.replace(session?.user?.role === "admin" ? "/staff_admin/dashboard" : "/staff_admin/login");
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
    </div>
  );
}
