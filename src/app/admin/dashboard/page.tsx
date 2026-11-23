"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Bike,
  CreditCard,
  Crown,
  Banknote,
  BadgeCheck,
  BarChart3,
  MapPin,
  RefreshCw,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { ErrorBanner, LoadingBlock } from "@/components/admin/ui";

/*
 * Mirrors the app's AdminMain/index.tsx ("Dashboard Overview"): same sections in the same order,
 * same wording and the same colours (light theme values from that screen), laid out for the web.
 */
const TIMEFRAMES = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7days", label: "7 Days" },
  { id: "last30days", label: "30 Days" },
  { id: "thisMonth", label: "This Month" },
];

const A = "/admin/dashboard";
const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;
const isoLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function AdminDashboardPage() {
  const [timeframe, setTimeframe] = useState("all");
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const stats = useAsync(() => api.getDashboardStats({ timeframe }), `stats-${timeframe}`);
  const charts = useAsync(() => api.getDashboardCharts(7), "charts-7");

  const k = stats.data?.kpi;
  const fin = k?.finances;
  const isSuperAdmin = stats.data?.isSuperAdmin !== false;

  // app: 7-day timeline, filling days without orders with zero
  const timeline = useMemo(() => {
    const trends = charts.data?.dailyTrends || [];
    const list: Array<{ date: string; day: string; dayNum: string; sales: number; orders: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const utc = d.toISOString().split("T")[0];
      const local = isoLocal(d);
      const found = trends.find((t) => t._id === utc || t._id === local);
      list.push({
        date: local,
        day: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: String(d.getDate()),
        sales: found ? Number(found.sales || 0) : 0,
        orders: found ? Number(found.ordersCount || 0) : 0,
      });
    }
    return list;
  }, [charts.data]);
  const maxSales = Math.max(...timeline.map((t) => t.sales), 1000);
  const maxOrders = Math.max(...timeline.map((t) => t.orders), 5);
  const totalSales = timeline.reduce((n, t) => n + t.sales, 0);
  const totalOrders = timeline.reduce((n, t) => n + t.orders, 0);
  const peak = [...timeline].sort((a, b) => (metric === "sales" ? b.sales - a.sales : b.orders - a.orders))[0];

  // app: payment methods grouped into COD vs Online
  const payments = useMemo(() => {
    const raw = stats.data?.paymentBreakdown?.length ? stats.data.paymentBreakdown : charts.data?.paymentBreakdown || [];
    const isCod = (id: string | null) => /cash|cod/i.test(id || "");
    const cod = raw.filter((p) => isCod(p._id));
    const digital = raw.filter((p) => !isCod(p._id) && (p._id || "").toLowerCase() !== "replacement (no charge)");
    const sum = (l: typeof raw, f: "amount" | "count") => l.reduce((n, p) => n + (p[f] || 0), 0);
    const codAmount = sum(cod, "amount");
    const digitalAmount = sum(digital, "amount");
    const total = codAmount + digitalAmount || 1;
    return [
      { id: "cod", label: "Cash On Delivery (COD)", icon: Banknote, color: "#F59E0B", gradient: "linear-gradient(90deg,#F59E0B,#D97706)", bgLight: "#FEF3C7", amount: codAmount, count: sum(cod, "count"), pct: Math.round((codAmount / total) * 100) },
      { id: "digital", label: "Online Payment", icon: CreditCard, color: "#0284C7", gradient: "linear-gradient(90deg,#0284C7,#0369A1)", bgLight: "#E0F2FE", amount: digitalAmount, count: sum(digital, "count"), pct: Math.round((digitalAmount / total) * 100) },
    ];
  }, [stats.data, charts.data]);

  const totalO = k?.orders.total || 0;
  const completedPct = totalO > 0 ? Math.round(((k?.orders.completed || 0) / totalO) * 100) : 0;
  const pendingPct = totalO > 0 ? Math.round(((k?.orders.pending || 0) / totalO) * 100) : 0;

  const refresh = () => {
    stats.reload();
    charts.reload();
  };

  return (
    <div className="text-[#0F172A] space-y-5">
      {/* ── Top welcome & timeframe filter ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0F172A]">Dashboard Overview</h1>
            <p className="text-sm text-[#64748B]">Live updates of your sales, orders, and stores</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[rgba(16,185,129,0.12)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-extrabold text-[#10B981]">LIVE</span>
            </span>
            <button type="button" onClick={refresh} className="p-2 rounded-lg text-[#0284C7] hover:bg-[#E0F2FE] cursor-pointer" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${stats.loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="Timeframe">
          {TIMEFRAMES.map((t) => {
            const on = timeframe === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTimeframe(t.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full border text-[13px] cursor-pointer ${on ? "bg-[#0284C7] border-[#0284C7] text-white font-bold" : "bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] font-semibold"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {stats.error && <ErrorBanner message={stats.error} onRetry={stats.reload} />}

      {stats.loading && !stats.data ? (
        <LoadingBlock text="Loading dashboard…" />
      ) : k ? (
        <>
          {/* ── Financial KPI banner (super admin commission terminal) ── */}
          {isSuperAdmin && fin && (
            <section className="rounded-2xl border border-[#A7F3D0] bg-[linear-gradient(135deg,#ECFDF5,#D1FAE5)] p-4 md:p-5 shadow-[0_4px_14px_rgba(16,185,129,0.12)]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[10px] bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                </span>
                <div>
                  <p className="text-base font-extrabold text-[#065F46]">Platform Commission ({((fin.commissionRate || 0.015) * 100).toFixed(1)}%)</p>
                  <p className="text-xs font-semibold text-[#047857]">Automatically earned from delivered orders</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
                <FinStat label="Commission Earned" labelColor="#047857" value={nprNum(fin.netCommissionEarned)} valueColor="#065F46" />
                <FinStat label="Gross Transacted" labelColor="#475569" value={nprNum(fin.grossTransactions)} valueColor="#0F172A" />
                <FinStat label="Vendor Earnings" labelColor="#475569" value={nprNum(fin.vendorGrossEarnings)} valueColor="#0F172A" />
                <FinStat label="Pending Withdrawals" labelColor="#B45309" value={`${fin.pendingWithdrawalsCount} Requests`} valueColor="#D97706" href={`${A}/finance`} />
              </div>
            </section>
          )}

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
            <Kpi href={`${A}/orders`} label="Total Orders" icon={ShoppingCart} iconColor="#0284C7" iconBg="rgba(2,132,199,0.12)" value={String(k.orders.total || 0)}>
              <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="inline-flex items-center gap-1 text-[#10B981] font-semibold"><Dot c="#10B981" /> {k.orders.completed || 0} Delivered</span>
                <span className="inline-flex items-center gap-1 text-[#F59E0B] font-semibold"><Dot c="#F59E0B" /> {k.orders.pending || 0} In Progress</span>
              </span>
            </Kpi>
            <Kpi href={`${A}/finance`} label="Total Sales" icon={TrendingUp} iconColor="#10B981" iconBg="rgba(16,185,129,0.12)" value={nprNum(k.orders.grossSales)}>
              <span className="text-[#64748B]">Delivered orders total</span>
            </Kpi>
            <Kpi href={`${A}/vendors`} label="Vendors" icon={Store} iconColor="#A855F7" iconBg="rgba(168,85,247,0.12)" value={String(k.vendors.total || 0)}>
              <span className="flex flex-col">
                <span className="text-[#10B981] font-semibold">{k.vendors.active || 0} Active Stores</span>
                <span className="text-[#F59E0B] font-semibold">{k.vendors.pendingVerification || 0} Pending Approval</span>
              </span>
            </Kpi>
            <Kpi href={`${A}/delivery`} label="Delivery Riders" icon={Bike} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.12)" value={String(k.deliveryBoys.total || 0)}>
              <span className="text-[#10B981] font-semibold">🟢 {k.deliveryBoys.online || 0} Online Now</span>
            </Kpi>
            <Kpi href={`${A}/customers`} label="Customers" icon={Users} iconColor="#3B82F6" iconBg="rgba(59,130,246,0.12)" value={String(k.customers.total || 0)}>
              <span className="text-[#64748B]">{k.customers.active || 0} Active customers</span>
            </Kpi>
            <Kpi href={`${A}/tickets`} label="Open Tickets" icon={Ticket} iconColor="#EF4444" iconBg="rgba(239,68,68,0.12)" value={String(k.tickets.open || 0)} valueColor="#EF4444">
              <span className="text-[#64748B]">Needs help or reply</span>
            </Kpi>
          </div>

          {/* ── Quick actions ── */}
          <Section icon={Zap} iconColor="#0284C7" title="Quick Actions" right={<span className="text-xs font-semibold text-[#64748B]">Shortcuts</span>}>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <Shortcut href={`${A}/vendors`} icon={Store} color="#0284C7" bg="#E0F2FE" label="Vendors" />
              {isSuperAdmin && <Shortcut href={`${A}/staff-admins`} icon={UserPlus} color="#7E22CE" bg="#F3E8FF" label="Staff Admins" />}
              <Shortcut href={`${A}/catalog`} icon={Shapes} color="#D97706" bg="#FEF3C7" label="Products" />
              <Shortcut href={`${A}/map`} icon={MapPin} color="#15803D" bg="#DCFCE7" label="Riders Map" />
              <Shortcut href={`${A}/notifications`} icon={Bell} color="#E11D48" bg="#FFE4E6" label="Send Alerts" />
            </div>
          </Section>

          <div className="grid grid-cols-1 2xl:grid-cols-[3fr_2fr] gap-5">
            {/* ── Sales & orders chart ── */}
            <Section
              icon={BarChart3}
              iconColor="#0284C7"
              title="Sales & Orders Chart"
              subtitle="Last 7 days performance"
              right={
                <div className="flex rounded-lg bg-[#F1F5F9] p-0.5" role="group" aria-label="Chart metric">
                  {(["sales", "orders"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m} className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${metric === m ? "bg-[#0284C7] text-white" : "text-[#64748B]"}`}>
                      {m === "sales" ? "Sales" : "Orders"}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="flex items-stretch rounded-xl bg-[#F8FAFC] px-4 py-3 mb-4">
                <div className="flex-1">
                  <p className="text-[11px] text-[#64748B]">{metric === "sales" ? "7 Days Sales" : "7 Days Orders"}</p>
                  <p className="text-base font-extrabold text-[#0F172A]">{metric === "sales" ? nprNum(totalSales) : `${totalOrders} Orders`}</p>
                </div>
                <span className="w-px bg-[#E2E8F0] mx-4" />
                <div className="flex-1">
                  <p className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
                    <Sparkles className="w-3 h-3 text-[#10B981]" /> Best Day ({peak?.day || "N/A"})
                  </p>
                  <p className="text-base font-extrabold text-[#10B981]">{metric === "sales" ? nprNum(peak?.sales) : `${peak?.orders || 0} Orders`}</p>
                </div>
              </div>
              {charts.loading && !charts.data ? (
                <LoadingBlock />
              ) : (
                <div className="flex items-end gap-2 h-48" role="img" aria-label={`Daily ${metric} for the last 7 days`}>
                  {timeline.map((t) => {
                    const val = metric === "sales" ? t.sales : t.orders;
                    const max = metric === "sales" ? maxSales : maxOrders;
                    const pct = Math.max(12, Math.min(100, Math.round((val / max) * 100)));
                    const isPeak = val > 0 && (metric === "sales" ? t.sales === peak?.sales : t.orders === peak?.orders);
                    const fill = isPeak ? "linear-gradient(180deg,#34D399,#059669)" : metric === "sales" ? "linear-gradient(180deg,#38BDF8,#0284C7)" : "linear-gradient(180deg,#A78BFA,#7C3AED)";
                    return (
                      <div key={t.date} className="flex-1 h-full flex flex-col items-center min-w-0">
                        <span className={`h-5 flex items-center gap-0.5 text-[10px] truncate ${isPeak ? "font-extrabold text-[#10B981]" : "font-semibold text-[#64748B]"}`}>
                          {isPeak && <Crown className="w-3 h-3 text-[#10B981]" />}
                          {metric === "sales" && val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                        </span>
                        <div className="flex-1 w-full max-w-10 rounded-[7px] bg-[#F1F5F9] border border-[#E2E8F0] flex items-end overflow-hidden">
                          <div className="w-full rounded-[7px]" style={{ height: `${pct}%`, background: fill }} title={`${t.date}: ${metric === "sales" ? nprNum(t.sales) : `${t.orders} orders`}`} />
                        </div>
                        <span className={`mt-1.5 text-[11px] ${isPeak ? "font-extrabold text-[#0284C7]" : "font-semibold text-[#475569]"}`}>{t.day}</span>
                        <span className="text-[10px] text-[#64748B]">{t.dayNum}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            <div className="space-y-5">
              {/* ── Payment methods ── */}
              <Section icon={Wallet} iconColor="#10B981" title="Payment Methods" right={<span className="text-xs font-semibold text-[#64748B]">How Customers Paid</span>}>
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div key={p.id} className="rounded-xl bg-[#F8FAFC] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: p.bgLight }}>
                            <p.icon className="w-[18px] h-[18px]" style={{ color: p.color }} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold text-[#0F172A] truncate">{p.label}</span>
                            <span className="block text-[11px] text-[#64748B]">{p.count} orders</span>
                          </span>
                        </span>
                        <span className="text-right shrink-0">
                          <span className="block text-sm font-extrabold text-[#0F172A]">{nprNum(p.amount)}</span>
                          <span className="block text-[11px] font-bold" style={{ color: p.color }}>{p.pct}% of total</span>
                        </span>
                      </div>
                      <div className="mt-2.5 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.gradient }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ── Order delivery status ── */}
              <Section
                icon={Truck}
                iconColor="#0284C7"
                iconBg="rgba(2,132,199,0.12)"
                title="Order Delivery Status"
                right={
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[10px] bg-[rgba(16,185,129,0.12)] text-xs font-extrabold text-[#10B981]">
                    <BadgeCheck className="w-3.5 h-3.5" /> {completedPct}% Delivered
                  </span>
                }
              >
                <div className="h-2.5 rounded-[5px] bg-[#E2E8F0] overflow-hidden flex">
                  <span className="h-full bg-[#10B981]" style={{ width: `${completedPct}%` }} />
                  <span className="h-full bg-[#F59E0B]" style={{ width: `${pendingPct}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5"><Dot c="#10B981" /> Delivered ({k.orders.completed || 0})</span>
                  <span className="inline-flex items-center gap-1.5"><Dot c="#F59E0B" /> Pending / On The Way ({k.orders.pending || 0})</span>
                </div>
              </Section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const Dot = ({ c }: { c: string }) => <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c }} />;

function FinStat({ label, labelColor, value, valueColor, href }: { label: string; labelColor: string; value: string; valueColor: string; href?: string }) {
  const body = (
    <div className="h-full rounded-xl border border-[#A7F3D0] bg-white/65 px-3 py-2.5">
      <p className="text-[11px] font-semibold" style={{ color: labelColor }}>{label}</p>
      <p className="text-base font-extrabold mt-0.5 break-words leading-tight" style={{ color: valueColor }}>{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block hover:brightness-[0.98]">{body}</Link> : body;
}

function Kpi({
  href,
  label,
  icon: Icon,
  iconColor,
  iconBg,
  value,
  valueColor = "#0F172A",
  children,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  value: string;
  valueColor?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block bg-white border border-[#E2E8F0] rounded-2xl p-4 hover:shadow-md transition-shadow">
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#64748B]">{label}</span>
        <span className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </span>
      </span>
      <span className="block mt-1 text-lg sm:text-xl font-extrabold break-words leading-tight" style={{ color: valueColor }}>{value}</span>
      <span className="block mt-1 text-[11px]">{children}</span>
    </Link>
  );
}

function Section({
  icon: Icon,
  iconColor,
  iconBg = "#F1F5F9",
  title,
  subtitle,
  right,
  children,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold text-[#0F172A]">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Shortcut({ href, icon: Icon, color, bg, label }: { href: string; icon: React.ElementType; color: string; bg: string; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 py-2 rounded-xl hover:bg-[#F8FAFC]">
      <span className="w-14 h-14 rounded-[15px] flex items-center justify-center" style={{ backgroundColor: bg }}>
        <Icon className="w-[22px] h-[22px]" style={{ color }} />
      </span>
      <span className="text-xs font-semibold text-[#0F172A] text-center">{label}</span>
    </Link>
  );
}
