"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Banknote, Boxes, ChevronLeft, ChevronRight, CornerDownLeft, LineChart, Loader2, Search, Shapes, Store, Trophy, X } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { useConsole } from "@/lib/admin/console";
import { ErrorBanner } from "@/components/admin/ui";

/*
 * Mirrors the app's Screens/adminScreens/vendor-analytics.tsx ("Vendor Analytics"): store scope,
 * time ranges, Performance Overview KPI cards (each opens the deep-dive), top products,
 * sales by category and the product catalog performance table — same wording and colours.
 * Shared by the Super Admin (/vendor-analytics) and Staff Admin (/analytics) consoles.
 */
const RANGES = [
  { label: "All Time", value: "all" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "Monthly", value: "monthly" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
] as const;

const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;

export default function VendorAnalyticsPage() {
  const { staff, base } = useConsole();
  const detailsBase = `${base}/${staff ? "analytics" : "vendor-analytics"}/details`;
  const stores = useAsync(() => api.getStoreOptions(), "va-vendors");
  const [vendorId, setVendorId] = useState("all");
  const [range, setRange] = useState<string>("all");
  const vid = vendorId === "all" ? undefined : vendorId;
  const q = useAsync(() => api.getVendorAnalytics({ vendorId: vid, range }), `va-${vendorId}-${range}`);
  const s = q.data?.summary;
  const detailsHref = (tab: string) => `${detailsBase}?vendorId=${encodeURIComponent(vendorId)}&range=${range}&tab=${tab}`;

  return (
    <div className="text-[#0F172A] space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold">Vendor Analytics</h1>
        <p className="text-sm text-[#64748B]">Operational Sales & Product Insights</p>
      </div>

      {/* Store scope + time range */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <label className="block lg:w-80">
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#475569] mb-1.5">
            <Store className="w-3.5 h-3.5 text-[#10B981]" /> Assigned Store Scope
          </span>
          <select
            className="w-full h-11 px-3 rounded-[10px] bg-white border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] focus:outline-none focus:border-[#10B981]"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            aria-label="Store scope"
          >
            <option value="all">{staff ? "All Assigned Stores" : "All Stores"} ({stores.data?.data.length ?? 0})</option>
            {(stores.data?.data || []).map((v) => (
              <option key={v._id} value={v._id}>
                {v.businessDetails?.businessName || "Store"}
              </option>
            ))}
          </select>
        </label>
        <div className="flex-1 flex flex-wrap gap-1 p-1 rounded-xl bg-white border border-[#E2E8F0]" role="tablist" aria-label="Time range">
          {RANGES.map((r) => {
            const on = range === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setRange(r.value)}
                className={`flex-1 min-w-[72px] py-2 rounded-lg text-xs font-bold cursor-pointer ${on ? "bg-[rgba(16,185,129,0.12)] text-[#10B981]" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

      {q.loading && !q.data ? (
        <div className="py-16 flex flex-col items-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-[#10B981]" />
          <p className="text-sm text-[#64748B]">Aggregating operational analytics...</p>
        </div>
      ) : (
        <>
          {/* Performance overview */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold">Performance Overview</h2>
            <Link href={detailsHref("all")} className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline">
              Deep-Dive Analysis <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard href={detailsHref("gross")} icon={Banknote} color="#10B981" bg="rgba(16,185,129,0.12)" label="Gross Sales" value={nprNum(s?.grossSales)} sub={`${s?.orderCount || s?.totalOrders || 0} total orders`} />
            <KpiCard href={detailsHref("net")} icon={LineChart} color="#0EA5E9" bg="rgba(14,165,233,0.12)" label="Net Realized" value={nprNum(s?.netSales)} sub={`${s?.completedOrders || 0} delivered`} subColor="#10B981" />
            <KpiCard
              href={detailsHref("payment")}
              icon={Boxes}
              color="#F59E0B"
              bg="rgba(245,158,11,0.12)"
              label="Payment Split"
              value={`COD: ${nprNum(s?.codSales)}`}
              valueSmall
              sub={`Online: ${nprNum(s?.onlineSales)}`}
            />
            <KpiCard
              href={detailsHref("returns")}
              icon={CornerDownLeft}
              color="#EF4444"
              bg="rgba(239,68,68,0.12)"
              label="Return / Cancel"
              value={`${s?.returnedOrders || 0} returns`}
              valueColor="#EF4444"
              sub={`${s?.cancelledOrders || 0} cancelled (${s?.returnRefundRate || 0}%)`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Top selling products */}
            {!!q.data?.topSellingProducts.length && (
              <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
                <h3 className="flex items-center gap-2 text-[15px] font-extrabold mb-2">
                  <Trophy className="w-[18px] h-[18px] text-[#F59E0B]" /> Top Selling Products
                </h3>
                <ul>
                  {q.data.topSellingProducts.map((p, i) => (
                    <li key={p.productId || i} className="flex items-center gap-2.5 py-2.5 border-b border-[#E2E8F0] last:border-0">
                      <span className="px-2 py-0.5 rounded-md bg-[rgba(245,158,11,0.12)] text-xs font-extrabold text-[#D97706]">#{i + 1}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold truncate">{p.name || "Product"}</span>
                        <span className="block text-xs text-[#64748B]">
                          {p.unitsSold || 0} units sold • {nprNum(p.revenue)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Sales by category */}
            {!!q.data?.categoryBreakdown.length && (
              <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
                <h3 className="flex items-center gap-2 text-[15px] font-extrabold mb-2">
                  <Shapes className="w-[18px] h-[18px] text-[#10B981]" /> Sales by Category
                </h3>
                <ul>
                  {q.data.categoryBreakdown.map((c, i) => (
                    <li key={c.category || i} className="flex items-center justify-between gap-3 py-2.5 border-b border-[#E2E8F0] last:border-0">
                      <span className="text-sm font-semibold truncate">{c.category || "General"}</span>
                      <span className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-[#64748B]">{c.unitsSold || 0} sold</span>
                        <span className="text-sm font-bold text-[#10B981]">{nprNum(c.revenue)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <ProductPerformance vendorId={vid} />
        </>
      )}
    </div>
  );
}

function KpiCard({
  href,
  icon: Icon,
  color,
  bg,
  label,
  value,
  valueColor = "#0F172A",
  valueSmall = false,
  sub,
  subColor = "#64748B",
}: {
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  value: string;
  valueColor?: string;
  valueSmall?: boolean;
  sub: string;
  subColor?: string;
}) {
  return (
    <Link href={href} className="block bg-white border border-[#E2E8F0] rounded-2xl p-4 hover:shadow-md transition-shadow">
      <span className="flex items-center justify-between">
        <span className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: bg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color }} />
        </span>
        <ChevronRight className="w-4 h-4 text-[#64748B]" />
      </span>
      <span className="block mt-3 text-xs font-semibold text-[#64748B]">{label}</span>
      <span className={`block font-extrabold truncate ${valueSmall ? "text-sm mt-1" : "text-lg"}`} style={{ color: valueColor }}>
        {value}
      </span>
      <span className="block text-[11px] truncate" style={{ color: subColor }}>
        {sub}
      </span>
    </Link>
  );
}

function ProductPerformance({ vendorId }: { vendorId?: string }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [input]);
  const q = useAsync(() => api.getProductsAnalytics({ vendorId, search: search || undefined, page, limit: 10 }), `${vendorId || "all"}|${search}|${page}`);
  const products = q.data?.products || [];

  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-[15px] font-extrabold mb-3">
        <Boxes className="w-[18px] h-[18px] text-[#0EA5E9]" /> Product Catalog Performance ({q.data?.total ?? 0})
      </h3>
      <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] mb-2 md:max-w-md">
        <Search className="w-4 h-4 text-[#64748B] shrink-0" />
        <input className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#64748B]" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Filter product SKU, name or title..." aria-label="Filter products" />
        {input && (
          <button type="button" onClick={() => setInput("")} className="cursor-pointer" aria-label="Clear filter">
            <X className="w-4 h-4 text-[#64748B]" />
          </button>
        )}
      </div>

      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      {q.loading && !q.data ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#10B981]" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#64748B]">No products found for selected vendor scope.</p>
      ) : (
        <ul>
          {products.map((p, i) => (
            <li key={p._id || i} className="flex flex-col md:flex-row md:items-center gap-2 py-3 border-b border-[#E2E8F0] last:border-0">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold line-clamp-2">{p.title || p.name}</span>
                <span className="block text-xs text-[#64748B]">
                  SKU: {p.sku || "N/A"} • Stock: {p.stock ?? 0} • Price: NPR {(p.price || 0).toLocaleString()}
                </span>
              </span>
              <span className="flex gap-1.5 shrink-0">
                <Metric label="Sold" value={String(p.unitsSold || 0)} bg="#F1F5F9" color="#475569" />
                <Metric label="Gross" value={nprNum(p.grossSales)} bg="rgba(16,185,129,0.12)" color="#10B981" />
                <Metric label="Returned" value={String(p.returnedUnits || 0)} bg="rgba(239,68,68,0.12)" color="#EF4444" />
              </span>
            </li>
          ))}
        </ul>
      )}

      {(q.data?.pages || 1) > 1 && (
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-[#E2E8F0]">
          <button type="button" disabled={page <= 1} onClick={() => setPage((x) => x - 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F172A] disabled:text-[#94A3B8] cursor-pointer disabled:cursor-default">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-[#64748B]">
            Page {page} of {q.data?.pages}
          </span>
          <button type="button" disabled={page >= (q.data?.pages || 1)} onClick={() => setPage((x) => x + 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0F172A] disabled:text-[#94A3B8] cursor-pointer disabled:cursor-default">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, bg, color }: { label: string; value: string; bg: string; color: string }) {
  return (
    <span className="flex flex-col items-center px-2.5 py-1 rounded-lg min-w-[64px]" style={{ backgroundColor: bg }}>
      <span className="text-[10px] font-semibold" style={{ color }}>
        {label}
      </span>
      <span className="text-xs font-extrabold" style={{ color }}>
        {value}
      </span>
    </span>
  );
}
