"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCheck,
  Clock,
  HandCoins,
  Inbox,
  Loader2,
  MapPin,
  Minus,
  Package,
  Play,
  Plus,
  Power,
  QrCode,
  ShoppingBag,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { updateDeliveryRadius, updateStoreStatus } from "@/redux/slices/vendorSlice";
import { notificationHref } from "@/components/vendor/VendorHeader";

/*
 * Mirrors the app's VendorMain/dashboard.tsx: same sections in the same order, same wording and
 * the same colours (taken from that screen's StyleSheet), laid out full-width for the web.
 */
const RADIUS_PRESETS = [1, 3, 5, 8, 10, 15, 20]; // app: preset radius chips
const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;

// app: recent order status pill colours (default #F1F5F9 / #475569)
const statusPill = (s?: string) =>
  s === "DELIVERED"
    ? "bg-[#ECFDF5] text-[#059669]"
    : s === "PLACED"
      ? "bg-[#EFF6FF] text-[#1D4ED8]"
      : s === "CANCELLED"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : "bg-[#F1F5F9] text-[#475569]";

export default function SellerDashboardPage() {
  const dispatch = useAppDispatch();
  const v = useVendor();
  const m = v.stats?.metrics;
  const loc = v.vendorProfile?.shippingLocations;
  const open = v.isStoreOpen;
  const pending = m?.pendingOrders ?? v.pendingCount ?? 0;
  const recentOrders = (v.stats?.recentOrders?.length ? v.stats.recentOrders : v.orders.slice(0, 5)).filter(Boolean);
  const notifications = (v.notifications.length ? v.notifications : v.stats?.recentNotifications || []).filter(Boolean);
  const unread = v.unreadNotificationsCount || 0;

  const [toggling, setToggling] = useState(false);
  const [radiusSaving, setRadiusSaving] = useState(false);
  const [radiusMsg, setRadiusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const toggleStore = async () => {
    setToggling(true);
    await dispatch(updateStoreStatus(!open));
    setToggling(false);
  };

  const setRadius = async (km: number) => {
    if (km === v.deliveryRadiusKm || km < 1 || km > 50) return;
    setRadiusSaving(true);
    setRadiusMsg(null);
    const r = await dispatch(updateDeliveryRadius(km));
    setRadiusSaving(false);
    if (updateDeliveryRadius.rejected.match(r)) setRadiusMsg({ ok: false, text: (r.payload as string) || "Failed to update delivery radius" });
    else setRadiusMsg({ ok: true, text: `Your store delivery radius is now set to ${km} km. Nearby customer product availability has updated in real-time.` });
  };

  const orderLink = (status?: string) => (status ? `/seller/dashboard/orders?status=${status}` : "/seller/dashboard/orders");

  return (
    <div className="space-y-5 text-[#0F172A]">
      {/* ── Store status toggle bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#F1F5F9] rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${open ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
          <span className="text-sm font-semibold text-[#475569]">{open ? "Store is Open & Accepting Orders" : "Store is Currently Closed"}</span>
        </span>
        <button
          type="button"
          onClick={toggleStore}
          disabled={toggling}
          aria-pressed={open}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer disabled:opacity-70 ${
            open ? "bg-[#E6F4EA] text-[#10B981]" : "bg-[#FEE2E2] text-[#EF4444]"
          }`}
        >
          {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : open ? <Power className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {open ? "Close Store" : "Open Store"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Delivery coverage radius ── */}
        <section className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-sm p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-[38px] h-[38px] rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#016073]" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#0F172A]">Delivery Coverage Radius</h2>
              <p className="text-xs text-[#64748B]">Only customers within this radius can order</p>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#016073] text-white text-xs font-bold">{v.deliveryRadiusKm} km</span>
          </div>

          <div className="flex items-center justify-center gap-8">
            <button
              type="button"
              aria-label="Decrease radius"
              disabled={radiusSaving || v.deliveryRadiusKm <= 1}
              onClick={() => setRadius(v.deliveryRadiusKm - 1)}
              className="w-[38px] h-[38px] rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#016073] cursor-pointer disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-[#016073]">{v.deliveryRadiusKm} km</p>
              <p className="text-[11px] font-semibold text-[#64748B]">{radiusSaving ? "Saving…" : "Active Radius"}</p>
            </div>
            <button
              type="button"
              aria-label="Increase radius"
              disabled={radiusSaving || v.deliveryRadiusKm >= 50}
              onClick={() => setRadius(v.deliveryRadiusKm + 1)}
              className="w-[38px] h-[38px] rounded-full bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#016073] cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {RADIUS_PRESETS.map((r) => {
              const on = v.deliveryRadiusKm === r;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={radiusSaving}
                  onClick={() => setRadius(r)}
                  aria-pressed={on}
                  className={`px-3 py-1.5 rounded-2xl border text-xs cursor-pointer ${on ? "bg-[#016073] border-[#016073] text-white font-bold" : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] font-semibold"}`}
                >
                  {r} km
                </button>
              );
            })}
          </div>

          {radiusMsg && <p className={`text-xs font-medium ${radiusMsg.ok ? "text-[#059669]" : "text-[#DC2626]"}`} role="status">{radiusMsg.text}</p>}

          <div className="flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <p className="text-xs text-[#475569] truncate">
              {loc?.warehouseAddress || "Kathmandu Store Hub"}
              {" • "}
              {loc?.latitude != null && loc?.longitude != null ? `${Number(loc.latitude).toFixed(4)}°N, ${Number(loc.longitude).toFixed(4)}°E` : "Store coordinates not set"}
            </p>
          </div>
        </section>

        {/* ── Welcome gradient banner + financial highlights ── */}
        <div className="space-y-4">
          <section className="rounded-[14px] p-5 md:p-6 text-white bg-[linear-gradient(135deg,#016073_0%,#005566_50%,#00687D_100%)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold tracking-[1px] text-[#86C4CB]">SELLERHUB DASHBOARD</p>
                <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1">Welcome, {v.vendorUser?.name || "Partner"}</h1>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 text-xs font-bold text-white shrink-0">
                <BadgeCheck className="w-3.5 h-3.5 text-[#86C4CB]" /> Active Seller
              </span>
            </div>
            <p className="mt-3 text-sm text-[#E2E8F0]">Track real-time orders, monitor COD cash submissions and manage bank payouts.</p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/seller/dashboard/transactions" className="block rounded-xl border bg-[#F0FDF4] border-[#BBF7D0] p-4 hover:brightness-[0.98]">
              <span className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#15803D]">Withdrawable Balance</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#15803D]" />
              </span>
              <span className="block mt-1.5 text-xl font-extrabold text-[#15803D]">{nprNum(m?.availableWithdrawalBalance)}</span>
              <span className="block text-[11px] text-[#16A34A]">Settled & ready for bank payout</span>
            </Link>
            <Link href="/seller/dashboard/cod-handover" className="block rounded-xl border bg-[#FEF9C3] border-[#FDE047] p-4 hover:brightness-[0.98]">
              <span className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#854D0E]">COD Cash with Riders</span>
                <HandCoins className="w-4 h-4 text-[#854D0E]" />
              </span>
              <span className="block mt-1.5 text-xl font-extrabold text-[#854D0E]">{nprNum(m?.codCashWithDeliveryBoys)}</span>
              <span className="block text-[11px] text-[#A16207]">Tap to verify & confirm handover</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Live operations overview ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-base font-extrabold text-[#0F172A]">Live Operations Overview</h2>
          {v.statsLoading && <Loader2 className="w-4 h-4 animate-spin text-[#016073]" />}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3">
          <Metric icon={Banknote} iconBg="#ECFDF5" iconColor="#059669" value={nprNum(m?.totalSales)} label="Total Delivered Sales" />
          <Metric icon={ShoppingBag} iconBg="#EFF6FF" iconColor="#2563EB" value={`${m?.totalOrders ?? 0} Orders`} label="Lifetime Orders" />
          <Metric
            icon={Clock}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            value={`${pending} Pending`}
            valueColor="#D97706"
            label="Needs Acceptance"
            href={orderLink("pending")}
            highlight={pending > 0}
          />
          <Metric icon={Truck} iconBg="#F5F3FF" iconColor="#7C3AED" value={`${m?.processingOrders ?? 0} Active`} label="Preparing / Dispatched" href={orderLink("preparing")} />
          <Metric icon={CheckCheck} iconBg="#ECFDF5" iconColor="#10B981" value={`${m?.completedOrders ?? 0} Delivered`} label="Successfully Handed Over" href={orderLink("completed")} />
          <Metric icon={XCircle} iconBg="#FEF2F2" iconColor="#EF4444" value={`${m?.cancelledOrders ?? 0} Cancelled`} label="Declined / Cancelled" href={orderLink("cancelled")} />
        </div>
      </section>

      {/* ── Store management shortcuts ── */}
      <section>
        <h2 className="text-base font-extrabold text-[#0F172A] mb-3">Store Management Shortcuts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Shortcut href="/seller/dashboard/orders" icon={Truck} label={`Live Orders${pending > 0 ? ` (${pending})` : ""}`} />
          <Shortcut href="/seller/dashboard/cod-handover" icon={HandCoins} label="COD Handover" cod />
          <Shortcut href="/seller/dashboard/payment-qr" icon={QrCode} label="Payment QR" />
          <Shortcut href="/seller/dashboard/transactions?withdraw=1" icon={Wallet} label="Withdraw" />
        </div>
      </section>

      <div className={`grid grid-cols-1 gap-5 ${notifications.length ? "xl:grid-cols-[3fr_2fr]" : ""}`}>
        {/* ── Recent customer orders ── */}
        <section className="bg-white border border-[#F1F5F9] rounded-[14px] shadow-sm">
          <div className="flex items-center justify-between px-4 md:px-5 py-3.5">
            <h2 className="text-[15px] font-extrabold text-[#0F172A]">Recent Customer Orders</h2>
            <Link href="/seller/dashboard/orders" className="text-xs font-bold text-[#016073] hover:underline">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-7 flex flex-col items-center">
              <Inbox className="w-7 h-7 text-[#CBD5E1]" />
              <p className="text-[13px] text-[#94A3B8] mt-1.5">No customer orders received yet.</p>
            </div>
          ) : (
            <ul>
              {recentOrders.map((o, i) => {
                const delivered = o.orderStatus === "DELIVERED";
                return (
                  <li key={o._id || i} className={i < recentOrders.length - 1 ? "border-b border-[#F1F5F9]" : ""}>
                    <Link href={`/seller/dashboard/orders/${o._id}`} className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 hover:bg-[#F8FAFC]">
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                          {delivered ? <Check className="w-4 h-4 text-[#059669]" /> : <Package className="w-4 h-4 text-[#016073]" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-[#0F172A]">{o.orderNumber || "ORDER"}</span>
                          <span className="block text-xs text-[#64748B] truncate">
                            {o.items?.length || 1} Items · {o.customer?.name || o.customerName || "Customer"} · {o.paymentMethod || "COD"}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-extrabold text-[#0F172A]">NPR {o.totalAmount}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${statusPill(o.orderStatus)}`}>{o.orderStatus}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Recent notifications (app shows this card only when there are any) ── */}
        {notifications.length > 0 && (
          <section className="bg-white border border-[#F1F5F9] rounded-[14px] shadow-sm self-start">
            <div className="flex items-center justify-between px-4 md:px-5 py-3.5">
              <h2 className="text-[15px] font-extrabold text-[#0F172A]">Recent Notifications</h2>
              <Link href="/seller/dashboard/notifications" className="text-xs font-bold text-[#016073] hover:underline">View All ({unread} new)</Link>
            </div>
            <ul>
              {notifications.slice(0, 3).map((n, i, arr) => (
                <li key={n._id || i} className={i < arr.length - 1 ? "border-b border-[#F1F5F9]" : ""}>
                  <Link href={notificationHref(n)} className="flex items-start gap-3 px-4 md:px-5 py-3 hover:bg-[#F8FAFC]">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? "bg-[#CBD5E1]" : "bg-[#016073]"}`} />
                    <span className="min-w-0">
                      <span className={`block text-sm text-[#0F172A] ${n.isRead ? "" : "font-bold"}`}>{n.title || "Notification"}</span>
                      <span className="block text-xs text-[#64748B] line-clamp-2">{n.message}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  valueColor = "#0F172A",
  label,
  href,
  highlight = false,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  valueColor?: string;
  label: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <div
      className={`h-full bg-white rounded-xl shadow-sm p-4 ${highlight ? "border-[1.5px] border-[#F59E0B]" : "border border-[#F1F5F9]"} ${href ? "hover:shadow-md transition-shadow" : ""}`}
    >
      <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </span>
      <p className="mt-2.5 text-[15px] font-extrabold truncate" style={{ color: valueColor }}>{value}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function Shortcut({ href, icon: Icon, label, cod = false }: { href: string; icon: React.ElementType; label: string; cod?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-[10px] hover:brightness-[0.97] ${
        cod ? "bg-[linear-gradient(180deg,#FEF9C3,#FFFBEB)]" : "bg-[linear-gradient(180deg,#E6F4F6,#F0F9FA)]"
      }`}
    >
      <Icon className="w-[22px] h-[22px]" style={{ color: cod ? "#854D0E" : "#016073" }} />
      <span className="text-xs font-bold" style={{ color: cod ? "#854D0E" : "#016073" }}>{label}</span>
    </Link>
  );
}
