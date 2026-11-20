"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  Bike,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Store,
  Ticket,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime, npr, orderStatusBadge } from "@/lib/seller/format";
import { STAFF_BASE as S } from "@/lib/admin/console";
import { useStaffAdminSession } from "@/lib/admin/session";
import { Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Pill, StatCard, btn, field } from "@/components/admin/ui";

// app: StaffAdminMain/index.tsx
const TIMEFRAMES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7days", label: "7 Days" },
  { id: "30days", label: "30 Days" },
  { id: "thisMonth", label: "This Month" },
];

export default function StaffHomePage() {
  const session = useStaffAdminSession();
  const [timeframe, setTimeframe] = useState("today");
  const [vendorId, setVendorId] = useState("");
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const stores = useAsync(() => api.getAssignedStores(), "staff-stores");
  const q = useAsync(() => api.getStaffOverview({ timeframe, vendorId: vendorId || undefined }), `${timeframe}|${vendorId}`);

  const k = q.data?.kpi;
  const t = q.data?.pendingTasks;
  const trends = useMemo(() => q.data?.dailyTrends || [], [q.data]);
  const maxVal = Math.max(1, ...trends.map((d) => (metric === "sales" ? d.sales : d.ordersCount)));
  const storeCount = stores.data?.length ?? 0;

  const tasks = t
    ? [
        { label: "Refund Claims", desc: "Vendor-accepted returns for examination", count: t.pendingRefunds, suffix: "Pending", href: `${S}/refunds`, icon: RotateCcw, tone: "bg-violet-50 text-violet-600" },
        { label: "Brand Submissions", desc: "Vendor brand logos & certificates", count: t.pendingBrands, suffix: "Review", href: `${S}/brands`, icon: BadgeCheck, tone: "bg-sky-50 text-sky-600" },
        { label: "Withdrawal Requests", desc: "Examine ledger balance & escalate to Superadmin", count: t.pendingWithdrawals, suffix: "Pending", href: `${S}/withdrawals`, icon: Banknote, tone: "bg-amber-50 text-amber-600" },
        { label: "Vendor Support Tickets", desc: "Inquiries, issues & dispute resolutions", count: t.openTickets, suffix: "Open", href: `${S}/tickets`, icon: Ticket, tone: "bg-rose-50 text-rose-600" },
      ]
    : [];

  const modules = [
    { label: "Product Moderation", desc: "Stock, pricing & approvals", href: `${S}/products`, icon: Package },
    { label: "Order Tracking", desc: "Live fulfillment status", href: `${S}/orders`, icon: ShoppingBag },
    { label: "Rider Fleet", desc: "Deliveries & assignments", href: `${S}/delivery`, icon: Bike },
    { label: "COD Reconciliation", desc: "Cash audit & disputes", href: `${S}/cod`, icon: HandCoins },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome${session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}`}
        subtitle="Operations overview for your assigned stores."
        actions={
          <button type="button" onClick={() => { q.reload(); stores.reload(); }} className={btn.outline} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.id}
                type="button"
                role="tab"
                aria-selected={timeframe === tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  timeframe === tf.id
                    ? "bg-[#0284C7] border-[#0284C7] text-white shadow-sm shadow-sky-600/15"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[#0284C7] hover:text-[#0284C7]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <select className={`${field} lg:w-72`} value={vendorId} onChange={(e) => setVendorId(e.target.value)} aria-label="Filter by store">
            <option value="">All assigned stores ({storeCount})</option>
            {(stores.data || []).map((v) => (
              <option key={v._id} value={v._id}>{v.storeName || v.businessDetails?.businessName || "Store"}</option>
            ))}
          </select>
        </div>

        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

        {q.loading && !q.data ? (
          <LoadingBlock text="Loading dashboard…" />
        ) : k && t ? (
          <>
            {/* Operational pending work */}
            <Card
              title={
                <span className="flex items-center gap-2">
                  Operational Pending Work
                  {t.totalPendingTasks > 0 && <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{t.totalPendingTasks}</span>}
                </span>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {tasks.map((task) => (
                  <Link key={task.label} href={task.href} className="flex items-start gap-3 p-4 hover:bg-slate-50">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.tone}`}>
                      <task.icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">{task.label}</span>
                        {task.count > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{task.count} {task.suffix}</span>}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{task.desc}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 mt-1" />
                  </Link>
                ))}
              </div>
            </Card>

            {/* KPIs — calculated from live order and product records */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard label="Delivered Sales" value={npr(k.deliveredSales)} sub={`${k.deliveredOrders} orders delivered`} icon={CircleDollarSign} tone="green" href={`${S}/analytics`} />
              <StatCard label="Total Orders" value={k.totalOrders} sub={`${k.pendingOrders} pending, ${k.cancelledOrders} cancelled`} icon={ShoppingBag} tone="blue" href={`${S}/orders`} />
              <StatCard label="Assigned Stores" value={k.totalVendors} sub={`${k.activeVendors} approved${k.inactiveVendors ? `, ${k.inactiveVendors} not approved` : ""}`} icon={Store} tone="violet" href={`${S}/vendors`} />
              <StatCard
                label="Catalog Items"
                value={k.totalProducts}
                sub={
                  <span>
                    {k.activeProducts} active, {k.outOfStockProducts} out of stock
                    {k.outOfStockProducts > 0 && <span className="ml-1.5 px-1.5 rounded bg-red-50 text-red-600 font-bold">{k.outOfStockProducts} Low</span>}
                  </span>
                }
                icon={Package}
                tone="amber"
                href={`${S}/products`}
              />
              <StatCard label="COD Collections" value={npr(k.codSales)} sub="Cash with riders / store" icon={HandCoins} tone="teal" href={`${S}/cod`} />
              <StatCard label="Digital Sales" value={npr(k.onlineSales)} sub="Wallets & card payments" icon={CreditCard} tone="slate" href={`${S}/analytics`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card
                className="xl:col-span-2"
                title="7-Day Performance Trend"
                action={
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-bold" role="group" aria-label="Chart metric">
                    {(["sales", "orders"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetric(m)}
                        aria-pressed={metric === m}
                        className={`px-3 py-1.5 cursor-pointer transition-colors ${
                          metric === m ? "bg-[#0284C7] text-white" : "bg-white text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {m === "sales" ? "Sales" : "Orders"}
                      </button>
                    ))}
                  </div>
                }
              >
                {trends.length === 0 ? (
                  <EmptyState title="No orders in the last 7 days" />
                ) : (
                  <div className="p-5">
                    <div className="h-52 flex items-end gap-2" role="img" aria-label={`Daily ${metric} for the last 7 days`}>
                      {trends.map((d) => {
                        const val = metric === "sales" ? d.sales : d.ordersCount;
                        return (
                          <div key={d._id} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-slate-600 truncate">{metric === "sales" ? npr(val).replace("NPR ", "") : val}</span>
                            <div className="w-full rounded-t-md bg-[#0284C7]" style={{ height: `${Math.max(3, (val / maxVal) * 170)}px` }} title={`${d._id}: ${metric === "sales" ? npr(val) : `${val} orders`}`} />
                            <span className="text-[10px] text-slate-500">{new Date(`${d._id}T00:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric" })}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              <Card title="Operational Modules">
                <ul className="divide-y divide-slate-100">
                  {modules.map((m) => (
                    <li key={m.label}>
                      <Link href={m.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                        <span className="w-9 h-9 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0"><m.icon className="w-4 h-4" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-slate-900">{m.label}</span>
                          <span className="block text-[11px] text-slate-500">{m.desc}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card title="Recent Orders" action={<Link href={`${S}/orders`} className="text-xs font-bold text-[#0284C7] hover:underline">View all</Link>}>
              {!q.data?.recentOrders?.length ? (
                <EmptyState icon={AlertCircle} title="No recent orders in this timeframe." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {q.data.recentOrders.map((o) => (
                    <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">#{o.orderNumber}</p>
                        <p className="text-[11px] text-slate-500">{o.vendorName} · {formatDateTime(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold">{npr(o.totalAmount)}</span>
                        <Pill badge={orderStatusBadge(o.orderStatus)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
}
