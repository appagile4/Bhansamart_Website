"use client";

import React from "react";
import Link from "next/link";
import { Bike, ChevronRight, HandCoins, Radar, Wallet } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { npr } from "@/lib/seller/format";
import { STAFF_BASE as S } from "@/lib/admin/console";
import { ErrorBanner, PageHeader, StatCard } from "@/components/admin/ui";

// app: StaffAdminMain/deliveries.tsx — fleet hub + cash audit summary
const HUBS = [
  { title: "Delivery Fleet", subtitle: "View active riders, dispatches & delivery performance", cta: "Open Fleet Console", href: `${S}/delivery`, icon: Bike, tone: "bg-emerald-50 text-emerald-600" },
  { title: "COD Reconciliation", subtitle: "Audit collected cash, rider deposits & dispute records", cta: "Audit Cash Handover", href: `${S}/cod`, icon: HandCoins, tone: "bg-amber-50 text-amber-600" },
  { title: "Live Fleet Radar", subtitle: "GPS real-time map of store locations and active delivery riders", cta: "Open Radar Map", href: `${S}/map`, icon: Radar, tone: "bg-sky-50 text-sky-600" },
];

export default function StaffDeliveriesPage() {
  const q = useAsync(() => api.getCodReconciliation(), "staff-cod-summary");
  const rows = q.data?.reconciliation || [];
  // Backend field is `outstanding` (the app reads pendingCash/outstandingCash, which don't exist)
  const outstanding = rows.reduce((n, r) => n + Number(r.outstanding || 0), 0);
  const ridersWithCash = rows.filter((r) => Number(r.outstanding || 0) > 0).length;
  const collected = rows.reduce((n, r) => n + Number(r.totalCollected || 0), 0);

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Delivery fleet, cash-on-delivery audit and live tracking" />
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {HUBS.map((h) => (
            <Link key={h.title} href={h.href} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 hover:border-sky-200">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${h.tone}`}><h.icon className="w-5 h-5" /></span>
              <span>
                <span className="block text-sm font-extrabold text-slate-900">{h.title}</span>
                <span className="block text-xs text-slate-500 mt-1">{h.subtitle}</span>
              </span>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-bold text-[#0284C7]">{h.cta} <ChevronRight className="w-3.5 h-3.5" /></span>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-extrabold text-slate-900">Cash Audit Summary</h2>
          <p className="text-xs text-slate-500 mb-3">Verified collections from completed orders</p>
          {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard
              label="Outstanding Cash"
              value={q.loading && !q.data ? "…" : npr(outstanding)}
              sub={<span>Held by delivery riders{ridersWithCash > 0 && <span className="ml-1.5 px-1.5 rounded bg-amber-50 text-amber-700 font-bold">{ridersWithCash} Riders</span>}</span>}
              icon={Wallet}
              tone="amber"
              href={`${S}/cod`}
            />
            <StatCard label="Total Handover" value={q.loading && !q.data ? "…" : npr(collected)} sub="Lifetime collected COD" icon={HandCoins} tone="green" href={`${S}/cod`} />
          </div>
        </div>
      </div>
    </>
  );
}
