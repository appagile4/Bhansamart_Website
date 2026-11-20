"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminSession } from "@/lib/admin/session";

/** /admin → console when signed in as super admin, otherwise the admin login. */
export default function AdminEntryPage() {
  const router = useRouter();
  const session = useAdminSession();

  useEffect(() => {
    if (session === undefined) return; // still hydrating
    router.replace(session?.user?.role === "superadmin" ? "/admin/dashboard" : "/admin/login");
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
    </div>
  );
}
