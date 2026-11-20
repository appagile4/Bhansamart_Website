"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, Boxes, CornerDownLeft, CreditCard, LayoutDashboard, LineChart, Loader2, Shield, Store, TrendingUp } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { useConsole } from "@/lib/admin/console";
import { ErrorBanner, PageHeader } from "@/components/admin/ui";

/*
 * Mirrors the app's Screens/adminScreens/VendorAnalyticsDetailsScreen.tsx ("KPI Analytics Details"):
 * KPI tabs (All Details / Gross Sales / Net Realized / Payment Split / Returns / Cancel), sections,
 * wording and colours. Opened from the Vendor Analytics overview with ?vendorId&range&tab.
 */
type KpiTab = "all" | "gross" | "net" | "payment" | "returns";
const KPI_TABS: Array<{ id: KpiTab; label: string; icon: React.ElementType; color: string }> = [
  { id: "all", label: "All Details", icon: LayoutDashboard, color: "#0284C7" },
  { id: "gross", label: "Gross Sales", icon: Banknote, color: "#10B981" },
  { id: "net", label: "Net Realized", icon: LineChart, color: "#0EA5E9" },
  { id: "payment", label: "Payment Split", icon: Boxes, color: "#F59E0B" },
  { id: "returns", label: "Returns / Cancel", icon: CornerDownLeft, color: "#EF4444" },
];
const RANGES = [
  { label: "All Time", value: "all" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "Monthly", value: "monthly" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
];
const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;

/** app: getStatusColor */
const statusColor = (status: string) => {
  const s = (status || "").toUpperCase();
  if (s.includes("DELIVERED") || s.includes("COMPLETED")) return "#10B981";
  if (s.includes("CANCEL")) return "#EF4444";
  if (s.includes("RETURN") || s.includes("REFUND")) return "#F43F5E";
  if (s.includes("SHIP") || s.includes("OUT")) return "#0EA5E9";
  if (s.includes("CONFIRM") || s.includes("ACCEPT")) return "#8B5CF6";
  if (s.includes("PENDING") || s.includes("PROCESS")) return "#F59E0B";
  return "#64748B";
};

export default function VendorAnalyticsDetailsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DetailsView />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="py-16 flex flex-col items-center gap-2">
      <Loader2 className="w-7 h-7 animate-spin text-[#0284C7]" />
      <p className="text-sm text-[#64748B]">Aggregating detailed metrics...</p>
    </div>
  );
}

function DetailsView() {
  const router = useRouter();
  const params = useSearchParams();
  const { staff, base } = useConsole();
  const self = `${base}/${staff ? "analytics" : "vendor-analytics"}`;
  const vendorId = params.get("vendorId") || "all";
  const range = RANGES.some((r) => r.value === params.get("range")) ? params.get("range")! : "all";
  const tab: KpiTab = KPI_TABS.some((t) => t.id === params.get("tab")) ? (params.get("tab") as KpiTab) : "all";
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams({ vendorId, range, tab });
    next.set(k, v);
    router.replace(`${self}/details?${next.toString()}`);
  };

  const stores = useAsync(() => api.getStoreOptions(), "va-vendors");
  const q = useAsync(() => api.getVendorAnalytics({ vendorId: vendorId === "all" ? undefined : vendorId, range }), `vad-${vendorId}-${range}`);
  const a = q.data;
  const s = a?.summary;

  // app: derived metrics
  const grossSales = Number(s?.grossSales || 0);
  const totalOrders = Number(s?.totalOrders || s?.orderCount || 0);
  const netSales = Number(s?.netSales || 0);
  const completedOrders = Number(s?.completedOrders || 0);
  const codSales = Number(s?.codSales || 0);
  const onlineSales = Number(s?.onlineSales || 0);
  const cancelledOrders = Number(s?.cancelledOrders || 0);
  const returnedOrders = Number(s?.returnedOrders || 0);
  const returnRefundRate = Number(s?.returnRefundRate || 0);
  const aov = totalOrders > 0 ? Math.round(grossSales / totalOrders) : 0;
  const realizationRate = grossSales > 0 ? Math.min(100, Math.round((netSales / grossSales) * 100)) : 0;
  const totalPayments = codSales + onlineSales || grossSales || 1;
  const codPct = Math.round((codSales / totalPayments) * 100);
  const onlinePct = Math.round((onlineSales / totalPayments) * 100);
  const cancelRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : "0.0";
  const health = returnRefundRate < 5 && Number(cancelRate) < 5 ? { label: "Optimal", color: "#10B981" } : returnRefundRate < 10 ? { label: "Moderate", color: "#F59E0B" } : { label: "Needs Attention", color: "#EF4444" };

  const show = (t: KpiTab) => tab === "all" || tab === t;

  return (
    <div className="text-[#0F172A] space-y-4">
      <PageHeader backHref={self} title="KPI Analytics Details" subtitle="In-depth breakdown of vendor sales performance" />

      {/* Store filter + time range */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <label className="block lg:w-80">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#475569] mb-1.5">
            <Store className="w-3.5 h-3.5 text-[#0284C7]" /> Filter by Vendor Store
          </span>
          <select className="w-full h-11 px-3 rounded-[10px] bg-white border border-[#E2E8F0] text-sm font-semibold focus:outline-none focus:border-[#0284C7]" value={vendorId} onChange={(e) => setParam("vendorId", e.target.value)} aria-label="Vendor store">
            <option value="all">{staff ? "All Assigned Stores" : "All Stores"}</option>
            {(stores.data?.data || []).map((v) => (
              <option key={v._id} value={v._id}>
                {v.businessDetails?.businessName || "Store"}
              </option>
            ))}
          </select>
        </label>
        <div className="flex-1 flex flex-wrap gap-1.5" role="tablist" aria-label="Time range">
          {RANGES.map((r) => {
            const on = range === r.value;
            return (
              <button key={r.value} type="button" role="tab" aria-selected={on} onClick={() => setParam("range", r.value)} className={`px-3.5 py-2 rounded-full border text-xs font-bold cursor-pointer ${on ? "bg-[#0284C7] border-[#0284C7] text-white" : "bg-white border-[#E2E8F0] text-[#64748B]"}`}>
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="KPI">
        {KPI_TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setParam("tab", t.id)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer"
              style={on ? { backgroundColor: t.color, borderColor: t.color, color: "#FFFFFF" } : { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", color: "#64748B" }}
            >
              <t.icon className="w-4 h-4" style={{ color: on ? "#FFFFFF" : t.color }} /> {t.label}
            </button>
          );
        })}
      </div>

      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

      {q.loading && !a ? (
        <Loading />
      ) : a ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {show("gross") && (
            <Section icon={Banknote} color="#10B981" title="Gross Sales Analysis" sub="Top-line order volumes & value metrics">
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Total Gross Sales" value={nprNum(grossSales)} color="#10B981" hint="All placed orders" />
                <Mini label="Total Orders" value={String(totalOrders)} hint="Orders created" />
                <Mini label="Average Order (AOV)" value={nprNum(aov)} color="#0EA5E9" hint="Revenue per order" />
              </div>
              {!!a.ordersByStatus.length && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-[#0F172A] mb-2">Order Status Volume Distribution</p>
                  <ul className="space-y-2">
                    {a.ordersByStatus.map((st) => {
                      const count = st.count || 0;
                      const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                      const col = statusColor(st._id);
                      return (
                        <li key={st._id} className="flex items-center gap-3 text-xs">
                          <span className="w-32 shrink-0 flex items-center gap-1.5 font-semibold text-[#475569] truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col }} />
                            {(st._id || "UNKNOWN").replace(/_/g, " ")}
                          </span>
                          <span className="flex-1 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <span className="block h-full rounded-full" style={{ width: `${Math.max(5, pct)}%`, backgroundColor: col }} />
                          </span>
                          <span className="w-20 text-right font-bold text-[#0F172A] shrink-0">
                            {count} ({pct}%)
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {show("net") && (
            <Section icon={LineChart} color="#0EA5E9" title="Net Realized Revenue" sub="Actual completed delivered earnings after deductions">
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Net Realized Sales" value={nprNum(netSales)} color="#0EA5E9" hint="Delivered minus refunds" hintColor="#10B981" />
                <Mini label="Realization Rate" value={`${realizationRate}%`} color="#10B981" hint="Of gross sales captured" />
                <Mini label="Fulfilled Orders" value={String(completedOrders)} hint="Delivered to customers" />
              </div>
              {!!a.categoryBreakdown.length && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-[#0F172A] mb-2">Category Revenue Contribution</p>
                  <ul className="space-y-2">
                    {a.categoryBreakdown.map((c, i) => {
                      const rev = c.revenue || 0;
                      const share = grossSales > 0 ? Math.round((rev / grossSales) * 100) : 0;
                      return (
                        <li key={c.category || i} className="rounded-xl border border-[#E2E8F0] p-2.5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold truncate">{c.category || "General Products"}</span>
                            <span className="font-extrabold text-[#0EA5E9] shrink-0">{nprNum(rev)}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div className="h-full rounded-full bg-[#0EA5E9]" style={{ width: `${Math.min(100, share)}%` }} />
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] text-[#64748B]">
                            <span>{c.unitsSold || 0} items sold</span>
                            <span>{share}% share</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {show("payment") && (
            <Section icon={Boxes} color="#F59E0B" title="Payment Method Settlement Split" sub="Cash On Delivery vs Digital Prepaid Wallets">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[#F59E0B]">COD: {codPct}%</span>
                <span className="text-[#3B82F6]">Online: {onlinePct}%</span>
              </div>
              <div className="h-3 rounded-full bg-[#E2E8F0] overflow-hidden flex">
                <span className="h-full bg-[#F59E0B]" style={{ width: `${codPct}%` }} />
                <span className="h-full bg-[#3B82F6]" style={{ width: `${onlinePct}%` }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[#D97706]">
                    <Banknote className="w-5 h-5" /> Cash On Delivery
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[#92400E]">{nprNum(codSales)}</p>
                  <p className="text-[11px] text-[#B45309]">{codPct}% of total orders volume</p>
                  <p className="mt-1 text-[11px] text-[#B45309]">Collected by delivery partner upon handover.</p>
                </div>
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[#2563EB]">
                    <CreditCard className="w-5 h-5" /> Digital / Prepaid
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-[#1E40AF]">{nprNum(onlineSales)}</p>
                  <p className="text-[11px] text-[#1D4ED8]">{onlinePct}% of total orders volume</p>
                  <p className="mt-1 text-[11px] text-[#1D4ED8]">Prepaid via eSewa, Khalti, or cards with guaranteed capture.</p>
                </div>
              </div>
            </Section>
          )}

          {show("returns") && (
            <Section icon={CornerDownLeft} color="#EF4444" title="Returns & Cancellation Risk" sub="Operational health, refund rates, and order loss indicators">
              <div className="grid grid-cols-3 gap-2">
                <Mini label="Returns / Refunds" value={String(returnedOrders)} color="#EF4444" hint={`${returnRefundRate}% refund rate`} />
                <Mini label="Cancelled Orders" value={String(cancelledOrders)} color="#F43F5E" hint={`${cancelRate}% cancel rate`} />
                <Mini label="Operational Health" value={health.label} color={health.color} hint="Benchmark: < 5%" />
              </div>
              <div className="mt-4 rounded-xl bg-[#F1F5F9] p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                  <Shield className="w-4 h-4 text-[#0284C7]" /> Risk Mitigation Guidelines
                </p>
                <ul className="mt-1.5 space-y-1 text-[11px] text-[#475569]">
                  <li>• Verify perishable & fragile packing before delivery handoff to reduce transit damage returns.</li>
                  <li>• Ensure accurate SKU listing and weight specifications to minimize buyer cancellation.</li>
                  <li>• Contact buyers immediately upon order placement to confirm COD address validity.</li>
                </ul>
              </div>
            </Section>
          )}

          {tab === "all" && <SalesTimeline data={a.timeline} />}
        </div>
      ) : null}
    </div>
  );
}

function Section({ icon: Icon, color, title, sub, children }: { icon: React.ElementType; color: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1F` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold">{title}</h2>
          <p className="text-xs text-[#64748B]">{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Mini({ label, value, color = "#0F172A", hint, hintColor = "#64748B" }: { label: string; value: string; color?: string; hint: string; hintColor?: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 min-w-0">
      <p className="text-[10px] font-semibold text-[#64748B] truncate">{label}</p>
      <p className="text-sm md:text-base font-extrabold truncate" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] truncate" style={{ color: hintColor }}>
        {hint}
      </p>
    </div>
  );
}

/** app: staffAdminComponent/SalesChart ("Sales Trajectory Timeline") */
function SalesTimeline({ data }: { data: Array<{ date: string; sales: number; orders: number }> }) {
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [selected, setSelected] = useState<string | null>(null);
  const max = useMemo(() => Math.max(...data.map((d) => (metric === "sales" ? d.sales : d.orders)), metric === "sales" ? 500 : 5), [data, metric]);
  const sel = data.find((d) => d.date === selected) || data[data.length - 1];

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 xl:col-span-2">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
            <TrendingUp className="w-[18px] h-[18px] text-[#0284C7]" /> Sales Trajectory Timeline
          </h2>
          <p className="text-xs text-[#64748B]">Tap a day to see its totals</p>
        </div>
        <div className="flex rounded-lg bg-[#F1F5F9] p-0.5" role="group" aria-label="Chart metric">
          {(["sales", "orders"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m} className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer ${metric === m ? "bg-white text-[#0284C7] shadow-sm" : "text-[#64748B]"}`}>
              {m === "sales" ? "Sales" : "Orders"}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#64748B]">No sales in this range.</p>
      ) : (
        <>
          {sel && (
            <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-3 py-2 mb-3 text-xs">
              <span className="font-semibold text-[#475569]">{new Date(`${sel.date}T00:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className="font-extrabold text-[#0284C7]">
                {nprNum(sel.sales)} · {sel.orders} orders
              </span>
            </div>
          )}
          <div className="flex items-end gap-1.5 h-44 overflow-x-auto no-scrollbar">
            {data.map((d) => {
              const v = metric === "sales" ? d.sales : d.orders;
              const isSel = sel?.date === d.date;
              return (
                <button key={d.date} type="button" onClick={() => setSelected(d.date)} className="flex-1 min-w-[28px] h-full flex flex-col items-center justify-end gap-1 cursor-pointer" aria-label={`${d.date}: ${metric === "sales" ? nprNum(d.sales) : `${d.orders} orders`}`}>
                  <span className="w-full max-w-8 rounded-t-md" style={{ height: `${Math.max(4, (v / max) * 100)}%`, backgroundColor: isSel ? "#0284C7" : "#BAE6FD" }} />
                  <span className={`text-[10px] ${isSel ? "font-extrabold text-[#0284C7]" : "text-[#64748B]"}`}>{new Date(`${d.date}T00:00:00`).getDate()}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
