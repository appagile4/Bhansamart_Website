"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bike,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Package,
  PackageX,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchCodSummary, fetchVendorStats } from "@/redux/slices/vendorSlice";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { npr } from "@/lib/seller/format";
import { computeMonthReport, monthOptions, type MonthReport } from "@/lib/seller/report";
import { printVendorReport } from "@/lib/seller/reportPdf";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, StatCard, SuccessBanner, Tabs, btn } from "@/components/vendor/ui";

const TABS = [
  { key: "all", label: "All" },
  { key: "sales", label: "Sales" },
  { key: "delivery", label: "Deliveries & Returns" },
  { key: "growth", label: "Growth & Revenue" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const MONTHS = monthOptions();

export default function ReportsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading reports…" />}>
      <ReportsView />
    </Suspense>
  );
}

function ReportsView() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const v = useVendor();
  const raw = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "all";

  const { data: orders, error, loading, reload } = useAsync(() => api.getAllVendorOrders(), "all-orders");
  const [monthIdx, setMonthIdx] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const month = MONTHS[monthIdx];
  const prevMonth = MONTHS[monthIdx + 1] || null;
  const commissionRate = v.stats?.metrics.platformCommissionRate ?? 0.015;
  const r = useMemo(() => computeMonthReport(orders || [], month, prevMonth, commissionRate), [orders, month, prevMonth, commissionRate]);
  const riders = v.codSummary?.ridersDue || [];
  const riderCodCash = v.stats?.metrics.codCashWithDeliveryBoys ?? riders.reduce((n, x) => n + x.totalDue, 0);
  const storeName = v.vendorProfile?.businessDetails?.businessName || v.stats?.storeName || v.vendorUser?.name || "BhansaMart Seller";

  const show = (section: Exclude<TabKey, "all">) => tab === "all" || tab === section;

  const refresh = () => {
    reload();
    dispatch(fetchVendorStats());
    dispatch(fetchCodSummary());
  };

  const summaryText = () =>
    [
      `BHANSA VENDOR REPORT - ${month.label}`,
      ``,
      `Gross Revenue: ${npr(r.grossRevenue)}`,
      `Net Earnings: ${npr(r.netEarnings)}`,
      `Products Sold: ${r.unitsSold} units`,
      `Orders Completed: ${r.completedOrders}`,
      `Returned / Cancelled: ${r.cancelledOrders} (${r.returnRate}%)`,
      `Dispatched to Riders: ${r.dispatched}`,
      `Rider COD Cash in Hand: ${npr(riderCodCash)}`,
      prevMonth ? `MoM Growth vs ${prevMonth.label}: ${r.isGrowing ? "+" : ""}${r.revenueGrowthPct.toFixed(1)}%` : "",
      ``,
      `Generated from Bhansa Seller Portal.`,
    ].join("\n");

  const share = async () => {
    setActionError(null);
    const text = summaryText();
    try {
      if (navigator.share) {
        await navigator.share({ title: `Monthly Business Report - ${month.label}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setNotice("Report summary copied to clipboard.");
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const downloadPdf = () => {
    setActionError(null);
    const ok = printVendorReport({
      logoUrl: `${window.location.origin}/images/seller/vendor-banner-logo.png`,
      commissionRate,
      monthLabel: month.label,
      storeName,
      vendorPhone: v.vendorUser?.phone,
      vendorEmail: v.vendorUser?.email,
      panNumber: v.vendorProfile?.businessDetails?.panNumber || v.vendorProfile?.businessDetails?.gstNumber,
      curGrossRevenue: r.grossRevenue,
      curNetEarnings: r.netEarnings,
      curPlatformCommission: r.platformCommission,
      curUnitsSold: r.unitsSold,
      curCompletedOrders: r.completedOrders,
      curCancelledOrders: r.cancelledOrders,
      curCancelledUnits: r.cancelledUnits,
      curCancelledValue: r.cancelledValue,
      curReturnRate: r.returnRate,
      curDispatchedToRiders: r.dispatched,
      curDeliveredOrders: r.delivered,
      curInTransitOrders: r.inTransit,
      curDeliverySuccessRate: r.deliverySuccessRate,
      curCodRevenue: r.codRevenue,
      curOnlineRevenue: r.onlineRevenue,
      curCodOrdersCount: r.codOrdersCount,
      curOnlineOrdersCount: r.onlineOrdersCount,
      riderCodCash,
      prevMonthLabel: prevMonth?.label || "Previous month",
      prevGrossRevenue: r.prevGrossRevenue,
      prevOrdersCount: r.prevOrdersCount,
      prevUnitsSold: r.prevUnitsSold,
      revenueGrowthPct: r.revenueGrowthPct,
      isGrowing: r.isGrowing,
      topProducts: r.topProducts,
      codDueRiders: riders,
    });
    if (!ok) setActionError("Your browser blocked the report window. Allow pop-ups for this site and try again.");
    setExportOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Business Reports"
        subtitle="Monthly analytics & month-over-month growth"
        actions={
          <>
            <button type="button" onClick={refresh} className={btn.outline} aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => setExportOpen(true)} className={btn.primary} disabled={!orders}>
              <FileText className="w-4 h-4" /> Export Statement
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {(error || actionError) && <ErrorBanner message={(error || actionError)!} onRetry={error ? reload : undefined} />}

        {/* Month selection */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))} disabled={monthIdx >= MONTHS.length - 1} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-lg font-extrabold text-vendor-dark">{month.label}</p>
              <p className="text-[11px] text-slate-500">{r.ordersInMonth} order(s) this month</p>
            </div>
            <button type="button" onClick={() => setMonthIdx((i) => Math.max(0, i - 1))} disabled={monthIdx === 0} className="w-9 h-9 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
            {MONTHS.map((m, i) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMonthIdx(i)}
                aria-pressed={i === monthIdx}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${i === monthIdx ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-200 text-slate-600"}`}
              >
                {m.short}
              </button>
            ))}
          </div>
        </Card>

        <Tabs tabs={TABS} active={tab} onChange={(k) => router.replace(k === "all" ? "/seller/dashboard/reports" : `/seller/dashboard/reports?tab=${k}`)} />

        {loading && !orders ? (
          <LoadingBlock text="Crunching your monthly numbers…" />
        ) : (
          <>
            {/* Executive banner */}
            <section className="rounded-2xl bg-gradient-to-br from-vendor-dark via-vendor-mid to-vendor text-white p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold tracking-widest text-vendor-accent">GROSS REVENUE · {month.label.toUpperCase()}</p>
                  <p className="text-3xl md:text-4xl font-extrabold mt-1">{npr(r.grossRevenue)}</p>
                </div>
                {prevMonth && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${r.isGrowing ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-100"}`}>
                    {r.isGrowing ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {r.isGrowing ? "+" : ""}
                    {r.revenueGrowthPct.toFixed(1)}% vs {prevMonth.short}
                  </span>
                )}
              </div>
              <div className="border-t border-white/15 my-4" />
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[11px] text-white/70">Vendor Net Earnings</p>
                    <p className="text-lg font-extrabold">{npr(r.netEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/70">Products Sold</p>
                    <p className="text-lg font-extrabold">{r.unitsSold} units</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={share} className="h-9 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                    <Copy className="w-4 h-4" /> Share
                  </button>
                  <button type="button" onClick={downloadPdf} className="h-9 px-3 rounded-lg bg-white text-vendor-dark text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
            </section>

            {/* 4 core KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard label="Products Sold" value={`${r.unitsSold} units`} sub={`${r.completedOrders} orders · avg ${(r.unitsSold / Math.max(1, r.completedOrders)).toFixed(1)}/order`} icon={Package} tone="blue" />
              <StatCard label="Returns & Cancelled" value={r.cancelledOrders} sub={`${r.returnRate}% · ${npr(r.cancelledValue)} lost`} icon={PackageX} tone="red" />
              <StatCard label="Delivery Dispatches" value={r.dispatched} sub={`${r.delivered} delivered (${r.deliverySuccessRate}%) · ${r.inTransit} in transit`} icon={Truck} tone="violet" />
              <StatCard label="Net Earnings" value={npr(r.netEarnings)} sub={`after ${npr(r.platformCommission)} commission (${(commissionRate * 100).toFixed(1)}%)`} icon={Wallet} tone="green" />
            </div>

            {r.ordersInMonth === 0 && (
              <Card>
                <EmptyState icon={FileText} title={`No orders in ${month.label}`} text="Pick another month, or check back once orders come in." />
              </Card>
            )}

            {/* MoM growth */}
            {show("growth") && prevMonth && (
              <Card title={`Month-over-Month Growth vs ${prevMonth.label}`}>
                <div className="p-5 space-y-4">
                  <p className={`text-xs rounded-xl p-3 ${r.isGrowing ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                    {r.prevGrossRevenue === 0 && r.grossRevenue === 0
                      ? "No sales in either month yet."
                      : r.isGrowing
                        ? `Revenue grew ${r.revenueGrowthPct.toFixed(1)}% compared with ${prevMonth.label}.`
                        : `Revenue fell ${Math.abs(r.revenueGrowthPct).toFixed(1)}% compared with ${prevMonth.label}.`}
                  </p>
                  {(
                    [
                      ["Gross Revenue", r.grossRevenue, r.prevGrossRevenue, r.revenueGrowthPct, true],
                      ["Completed Orders", r.completedOrders, r.prevOrdersCount, r.ordersGrowthPct, false],
                      ["Units Sold", r.unitsSold, r.prevUnitsSold, r.unitsGrowthPct, false],
                    ] as const
                  ).map(([label, cur, prev, g, money]) => {
                    const max = Math.max(cur, prev, 1);
                    return (
                      <div key={label} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{label}</span>
                          <span className={`font-bold ${g >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                            {g >= 0 ? "+" : ""}
                            {g.toFixed(1)}%
                          </span>
                        </div>
                        <Bar label={month.short} value={money ? npr(cur) : String(cur)} pct={(cur / max) * 100} cls="bg-vendor" />
                        <Bar label={prevMonth.short} value={money ? npr(prev) : String(prev)} pct={(prev / max) * 100} cls="bg-slate-300" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Top products */}
              {show("sales") && (
                <Card title={`Top Products Sold in ${month.label}`}>
                  {r.topProducts.length === 0 ? (
                    <EmptyState icon={Package} title="No products sold this month" />
                  ) : (
                    <ol className="divide-y divide-slate-100">
                      {r.topProducts.map((p, i) => (
                        <li key={p.name + i} className="px-5 py-3 flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{i + 1}</span>
                          <span className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-300" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-500">{p.quantity} units sold</p>
                          </div>
                          <span className="text-sm font-extrabold text-slate-900">{npr(p.revenue)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              )}

              {/* Revenue split */}
              {show("sales") && (
                <Card title="Revenue Split & Payment Modes">
                  <div className="p-5 space-y-4">
                    {r.grossRevenue === 0 ? (
                      <p className="text-xs text-slate-500">No revenue recorded this month.</p>
                    ) : (
                      <>
                        <div className="h-3 rounded-full overflow-hidden flex bg-slate-100" role="img" aria-label={`Cash on delivery ${Math.round((r.codRevenue / r.grossRevenue) * 100)} percent`}>
                          <span className="bg-amber-500" style={{ width: `${(r.codRevenue / r.grossRevenue) * 100}%` }} />
                          <span className="bg-vendor" style={{ width: `${(r.onlineRevenue / r.grossRevenue) * 100}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> Cash on Delivery
                            </p>
                            <p className="text-lg font-extrabold text-slate-900 mt-1">{npr(r.codRevenue)}</p>
                            <p className="text-[11px] text-slate-500">{r.codOrdersCount} orders</p>
                          </div>
                          <div className="rounded-xl border border-vendor-200 bg-vendor-soft p-3">
                            <p className="text-[11px] font-bold text-vendor-dark flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-vendor" /> Online / QR
                            </p>
                            <p className="text-lg font-extrabold text-slate-900 mt-1">{npr(r.onlineRevenue)}</p>
                            <p className="text-[11px] text-slate-500">{r.onlineOrdersCount} orders</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Delivery logistics & returns */}
            {show("delivery") && (
              <Card title="Delivery Logistics & Returns">
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ["Dispatched", r.dispatched],
                      ["Delivered", r.delivered],
                      ["In Transit", r.inTransit],
                    ].map(([k, val]) => (
                      <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 py-3">
                        <p className="text-xl font-extrabold text-slate-900">{val}</p>
                        <p className="text-[11px] text-slate-500">{k}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-600">
                    Returns & cancellations: <span className="font-bold text-red-600">{r.cancelledOrders}</span> order(s), {r.cancelledUnits} unit(s), {npr(r.cancelledValue)} value · {r.returnRate}% rate.
                  </p>
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 flex items-center justify-between gap-3 text-xs text-violet-900">
                    <span className="flex items-center gap-2">
                      <Bike className="w-4 h-4" /> Rider COD cash in hand: <span className="font-extrabold">{npr(riderCodCash)}</span>
                    </span>
                    <Link href="/seller/dashboard/cod-handover" className="font-bold hover:underline inline-flex items-center gap-1">
                      Collect <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {riders.length > 0 && (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                      {riders.map((x) => (
                        <li key={x.deliveryBoy._id} className="px-3 py-2 flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            {x.deliveryBoy.fullName} <span className="text-slate-400">· {x.ordersCount} orders</span>
                          </span>
                          <span className="font-bold text-violet-700">{npr(x.totalDue)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} onDownload={downloadPdf} monthLabel={month.label} r={r} riderCodCash={riderCodCash} commissionRate={commissionRate} />
    </>
  );
}

function Bar({ label, value, pct, cls }: { label: string; value: string; pct: number; cls: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-12 text-slate-500">{label}</span>
      <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <span className={`block h-full rounded-full ${cls}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </span>
      <span className="w-24 text-right font-semibold text-slate-700">{value}</span>
    </div>
  );
}

/** App: "Export Statement Summary" modal */
function ExportModal({
  open,
  onClose,
  onDownload,
  monthLabel,
  r,
  riderCodCash,
  commissionRate,
}: {
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  monthLabel: string;
  r: MonthReport;
  riderCodCash: number;
  commissionRate: number;
}) {
  const rows: Array<[string, string, string?]> = [
    ["Gross Revenue", npr(r.grossRevenue)],
    [`Platform Commission (${(commissionRate * 100).toFixed(1)}%)`, `− ${npr(r.platformCommission)}`, "text-red-600"],
    ["Net Earnings", npr(r.netEarnings), "text-emerald-700 font-extrabold"],
    ["Orders Completed", String(r.completedOrders)],
    ["Units Sold", String(r.unitsSold)],
    ["Returned / Cancelled", `${r.cancelledOrders} (${r.returnRate}%)`],
    ["Dispatched to Riders", String(r.dispatched)],
    ["COD Revenue", npr(r.codRevenue)],
    ["Online Revenue", npr(r.onlineRevenue)],
    ["Rider COD Cash in Hand", npr(riderCodCash)],
  ];
  return (
    <Modal
      open={open}
      title={`Statement Summary · ${monthLabel}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Close
          </button>
          <button type="button" onClick={onDownload} className={btn.primary}>
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </>
      }
    >
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map(([k, val, cls]) => (
            <tr key={k}>
              <td className="py-2 text-slate-600">{k}</td>
              <td className={`py-2 text-right font-bold text-slate-900 ${cls || ""}`}>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-400 mt-3">The PDF opens in a print window — choose &ldquo;Save as PDF&rdquo; as the destination.</p>
    </Modal>
  );
}
