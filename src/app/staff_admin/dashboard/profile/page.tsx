"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, LogOut, Mail, Phone, ShieldCheck, Store, X } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { clearStaffAdminSession, useStaffAdminSession, type AdminPermissionFlags } from "@/lib/admin/session";
import { initials } from "@/lib/seller/format";
import { Card, Modal, PageHeader, btn } from "@/components/admin/ui";

// app: StaffAdminMain/profile.tsx — account, assigned stores, operational permissions
const PERMISSIONS: Array<{ key: keyof AdminPermissionFlags; label: string; defaultOn: boolean }> = [
  { key: "canManageVendors", label: "Manage assigned vendors", defaultOn: true },
  { key: "canEditProducts", label: "Edit product listings", defaultOn: true },
  { key: "canManageTickets", label: "Support ticket resolution", defaultOn: true },
  { key: "canViewOrders", label: "View orders", defaultOn: true },
  { key: "canSendNotifications", label: "Send notifications", defaultOn: true },
  { key: "canViewAnalytics", label: "View analytics", defaultOn: true },
  { key: "canReviewWithdrawals", label: "Review withdrawals", defaultOn: true },
  { key: "canReviewBrands", label: "Review brands", defaultOn: true },
  { key: "canExamineRefunds", label: "Examine refunds", defaultOn: true },
  { key: "canReconcileCod", label: "Reconcile COD", defaultOn: true },
  { key: "canTrackDeliveries", label: "Track deliveries", defaultOn: true },
  { key: "canBroadcastToAssignedVendors", label: "Broadcast to assigned vendors", defaultOn: false },
  { key: "canBroadcastToSpecificVendors", label: "Broadcast to specific vendors", defaultOn: false },
  { key: "canBroadcastToAllVendors", label: "Broadcast to all vendors", defaultOn: false },
];

export default function StaffProfilePage() {
  const router = useRouter();
  const session = useStaffAdminSession();
  const me = useAsync(() => api.getAdminMe(), "staff-me");
  const stores = useAsync(() => api.getAssignedStores(), "staff-stores");
  const [confirm, setConfirm] = useState(false);
  const user = me.data || session?.user || null;
  const perms = user?.adminPermissions || {};

  const logout = () => {
    clearStaffAdminSession();
    router.replace("/staff_admin/login");
  };

  return (
    <>
      <PageHeader title="Profile" subtitle="Account, assigned stores & operational permissions" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-6xl">
        <Card className="xl:col-span-2">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="w-16 h-16 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center text-xl font-extrabold shrink-0">{initials(user?.name || "Staff")}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-extrabold text-slate-900 truncate">{user?.name || "Staff Administrator"}</p>
                <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0284C7] border border-sky-100 text-[10px] font-bold uppercase">Staff Admin</span>
              </div>
              {user?.email && <p className="text-sm text-slate-600 flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5" /> {user.email}</p>}
              {user?.phone && <p className="text-sm text-slate-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</p>}
            </div>
          </div>
        </Card>

        <Card title={`Assigned Stores (${stores.data?.length ?? 0})`}>
          <div className="p-5">
            <p className="text-xs text-slate-500 mb-3">Your operations, dashboards, order actions and tickets are strictly scoped to these stores.</p>
            {stores.loading && !stores.data ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : stores.data?.length ? (
              <ul className="flex flex-wrap gap-2">
                {stores.data.map((s) => (
                  <li key={s._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    <Store className="w-3.5 h-3.5 text-sky-600" /> {s.storeName || s.businessDetails?.businessName || "Store"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-semibold text-amber-700">No stores currently assigned. Contact the platform super admin.</p>
            )}
          </div>
        </Card>

        <Card title="Operational Permissions">
          <ul className="divide-y divide-slate-100">
            {PERMISSIONS.map((p) => {
              const on = perms[p.key] ?? p.defaultOn;
              return (
                <li key={p.key} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <span className="text-xs text-slate-700">{p.label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${on ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {on ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {on ? "Granted" : "Restricted"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-2 px-5 py-3 border-t border-slate-100 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Financial payouts, central bank configs and platform commission settings are restricted to the super admin.
          </p>
        </Card>

        <div className="xl:col-span-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setConfirm(true)} className={btn.danger}><LogOut className="w-4 h-4" /> Log Out</button>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Session {me.error ? "could not be verified" : "verified"}</span>
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
        <p className="text-sm text-slate-700">Are you sure you want to log out of the staff admin console?</p>
      </Modal>
    </>
  );
}
