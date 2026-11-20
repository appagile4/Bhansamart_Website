"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Mail, Phone, Server, ShieldCheck } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { clearAdminSession, useAdminSession } from "@/lib/admin/session";
import { initials } from "@/lib/seller/format";
import { Card, Modal, PageHeader, btn } from "@/components/admin/ui";

// app: AdminMain/profile.tsx — account, authorization and system status.
// The app's theme and notification-preference switches only affect the mobile app, so they are not repeated here.
export default function AdminProfilePage() {
  const router = useRouter();
  const session = useAdminSession();
  const me = useAsync(() => api.getAdminMe(), "me");
  const [confirm, setConfirm] = useState(false);
  const user = me.data || session?.user || null;

  const logout = () => {
    clearAdminSession();
    router.replace("/admin/login");
  };

  const sessionState = me.loading && !me.data ? { label: "Checking…", cls: "text-slate-500" } : me.error ? { label: "Unverified", cls: "text-red-600" } : { label: "JWT Verified", cls: "text-emerald-600" };

  return (
    <>
      <PageHeader title="Admin Profile & System" subtitle="Account, authorization & platform status" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-6xl">
        <Card className="xl:col-span-2">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="w-16 h-16 rounded-2xl bg-sky-700 text-white flex items-center justify-center text-xl font-extrabold shrink-0">{initials(user?.name || "Admin")}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-extrabold text-slate-900 truncate">{user?.name || "BhansaMart Administrator"}</p>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold uppercase">{user?.role || "superadmin"}</span>
              </div>
              {user?.email && <p className="text-sm text-slate-600 flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5" /> {user.email}</p>}
              {user?.phone && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</p>}
            </div>
          </div>
          <dl className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
            {([
              ["Account ID", user?._id ? `#${user._id.slice(-8).toUpperCase()}` : "—", "text-slate-900"],
              ["Status", "Active Session", "text-emerald-600"],
              ["Security", sessionState.label, sessionState.cls],
            ] as const).map(([k, v, cls]) => (
              <div key={k} className="px-4 py-3 text-center">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                <dd className={`text-sm font-extrabold ${cls}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Administrative Authorization">
          <div className="p-5">
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <BadgeCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-emerald-800">Unrestricted Global Access</p>
                <p className="text-xs text-emerald-900/80 mt-0.5">Full platform control over all vendor stores, customers, delivery riders, central treasury bank details, and the fixed 1.5% commission engine.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="System & Platform Status">
          <dl className="divide-y divide-slate-100">
            {([
              ["Online payment platform fee", "1.5% (COD is 0%)", "text-slate-900"],
              ["Backend API", me.error ? "Unreachable" : me.loading && !me.data ? "Checking…" : "Connected", me.error ? "text-red-600" : "text-emerald-600"],
              ["Console interface", "Web console", "text-slate-900"],
            ] as const).map(([k, v, cls]) => (
              <div key={k} className="flex items-center justify-between gap-3 px-5 py-3">
                <dt className="text-xs text-slate-600 flex items-center gap-2">{k === "Backend API" ? <Server className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />} {k}</dt>
                <dd className={`text-xs font-bold ${cls}`}>{v}</dd>
              </div>
            ))}
          </dl>
          {me.error && <p className="px-5 pb-4 text-[11px] text-red-600">{me.error}</p>}
        </Card>

        <div className="xl:col-span-2">
          <button type="button" onClick={() => setConfirm(true)} className={`${btn.danger} w-full sm:w-auto`}><LogOut className="w-4 h-4" /> Log Out from Console</button>
        </div>
      </div>

      <Modal
        open={confirm}
        title="Log out"
        onClose={() => setConfirm(false)}
        footer={
          <>
            <button type="button" onClick={() => setConfirm(false)} className={btn.ghost}>Cancel</button>
            <button type="button" onClick={logout} className={btn.danger}>Log Out</button>
          </>
        }
      >
        <p className="text-sm text-slate-700">Are you sure you want to log out of the admin console?</p>
      </Modal>
    </>
  );
}
