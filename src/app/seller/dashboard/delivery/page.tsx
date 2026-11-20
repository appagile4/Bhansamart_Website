"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BellRing, Bike, CheckCircle2, Clock, Loader2, MapPin, PhoneCall, RefreshCw, Search, Star, Store, User, X, XCircle } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchVendorOrders } from "@/redux/slices/vendorSlice";
import type { SellerOrder } from "@/lib/seller/types";

/*
 * Mirrors the app's VendorMain/delivery.tsx ("Delivery & Fleet"): same metrics, tabs, search,
 * delivery card layout, wording and colours (from that screen's StyleSheet).
 */
const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "out", label: "Out For Delivery" },
  { key: "delivered", label: "Delivered" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const ACTIVE = ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];

const matchesTab = (o: SellerOrder, tab: TabKey) => {
  if (tab === "active") return ACTIVE.includes(o.orderStatus);
  if (tab === "out") return o.orderStatus === "OUT_FOR_DELIVERY";
  if (tab === "delivered") return o.orderStatus === "DELIVERED";
  return true; // app: "All" = every vendor order
};

/** app: delivery.tsx getDeliveryStatus */
const deliveryStatus = (o: SellerOrder): { bg: string; text: string; border: string; label: string; icon: React.ElementType } => {
  const hasRider = Boolean(o.assignedDeliveryBoy);
  switch (o.orderStatus) {
    case "OUT_FOR_DELIVERY":
      return { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE", label: "Out For Delivery", icon: Bike };
    case "READY_FOR_PICKUP":
      return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: hasRider ? "Rider Arrived / Ready" : "Ready For Pickup", icon: Store };
    case "ACCEPTED":
    case "PREPARING":
      return { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A", label: hasRider ? "Rider Assigned" : "Preparing / Dispatching", icon: Clock };
    case "DELIVERED":
      return { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0", label: "Delivered", icon: CheckCircle2 };
    case "CANCELLED":
    case "REJECTED":
      return { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", label: "Cancelled", icon: XCircle };
    default:
      return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "New / Dispatching", icon: BellRing };
  }
};

export default function DeliveryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DeliveryView />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="py-20 flex flex-col items-center gap-2">
      <Loader2 className="w-7 h-7 animate-spin text-[#0F766E]" />
      <p className="text-sm font-semibold text-[#64748B]">Loading live delivery fleet...</p>
    </div>
  );
}

function DeliveryView() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const { orders, ordersLoading, ordersLoaded } = useVendor();
  const raw = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "all";
  const tabLabel = TABS.find((t) => t.key === tab)?.label || "All";
  const [query, setQuery] = useState("");
  const refresh = () => dispatch(fetchVendorOrders());

  const metrics = useMemo(
    () => ({
      active: orders.filter((o) => ACTIVE.includes(o.orderStatus)).length,
      out: orders.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY").length,
      delivered: orders.filter((o) => o.orderStatus === "DELIVERED").length,
    }),
    [orders]
  );
  const counts: Record<TabKey, number> = { all: orders.length, active: metrics.active, out: metrics.out, delivered: metrics.delivered };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!matchesTab(o, tab)) return false;
      if (!q) return true;
      const rider = (o.assignedDeliveryBoy?.fullName || "").toLowerCase();
      const cust = (o.customer?.name || "").toLowerCase();
      const addr = (o.deliveryAddress?.addressLine || "").toLowerCase();
      return (o.orderNumber || "").toLowerCase().includes(q) || rider.includes(q) || cust.includes(q) || addr.includes(q);
    });
  }, [orders, tab, query]);

  return (
    <div className="text-[#0F172A]">
      {/* Sub header */}
      <div className="flex items-start justify-between gap-3 bg-white border border-[#F1F5F9] rounded-xl px-4 md:px-5 py-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F766E]">Delivery & Fleet</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Live dispatch, handover OTP verification, and rider tracking</p>
        </div>
        <button type="button" onClick={refresh} className="p-2 rounded-lg text-[#0F766E] hover:bg-[#F0FDFA] cursor-pointer" aria-label="Refresh fleet">
          <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metric highlights */}
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        {[
          { n: metrics.active, label: "Active Dispatches", color: "#0F766E" },
          { n: metrics.out, label: "Out For Delivery", color: "#7C3AED" },
          { n: metrics.delivered, label: "Delivered", color: "#16A34A" },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-[#E2E8F0] rounded-[10px] p-3 text-center">
            <p className="text-xl font-extrabold" style={{ color: m.color }}>{m.n}</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-3" role="tablist">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => router.replace(t.key === "all" ? "/seller/dashboard/delivery" : `/seller/dashboard/delivery?tab=${t.key}`)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-bold cursor-pointer ${on ? "bg-[#0F766E] text-white" : "bg-[#E2E8F0] text-[#475569]"}`}
            >
              {t.label} {counts[t.key] > 0 ? `(${counts[t.key]})` : ""}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[10px] px-3 h-11 md:max-w-xl">
        <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Order #, Rider, or Customer..."
          aria-label="Search deliveries"
          className="flex-1 bg-transparent text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="cursor-pointer" aria-label="Clear search">
            <X className="w-4 h-4 text-[#94A3B8]" />
          </button>
        )}
      </div>

      {/* Deliveries */}
      <div className="mt-3">
        {!ordersLoaded && ordersLoading && orders.length === 0 ? (
          <Loading />
        ) : visible.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center px-6">
            <Bike className="w-14 h-14 text-[#CBD5E1]" />
            <p className="mt-3 text-base font-extrabold text-[#1E293B]">{query ? "No matching deliveries found" : `No ${tab !== "all" ? `${tabLabel} ` : ""}deliveries`}</p>
            <p className="mt-1 text-sm text-[#64748B] max-w-md">
              {query ? "Try checking your search keywords or clear the search filter." : "When customers place orders and riders are dispatched, they will appear here in real-time."}
            </p>
            <button type="button" onClick={refresh} className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#0F766E] text-white text-sm font-bold cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Fleet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {visible.map((o) => (
              <DeliveryCard key={o._id || o.orderNumber} o={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryCard({ o }: { o: SellerOrder }) {
  const st = deliveryStatus(o);
  const rider = o.assignedDeliveryBoy;
  const pickedUp = o.orderStatus === "OUT_FOR_DELIVERY" || o.orderStatus === "DELIVERED";
  const placed = o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
  const customerPhone = o.deliveryAddress?.phone || o.customer?.phone;
  // Backend stores the plate as vehicleDetails.registrationNumber (the app reads a non-existent vehicleNumber)
  const plate = rider?.vehicleDetails?.registrationNumber;

  return (
    <article className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col">
      {/* Header: order number, time & status badge */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[#FAFAFA] border-b border-[#F1F5F9]">
        <div className="min-w-0">
          <Link href={`/seller/dashboard/orders/${o._id}`} className="text-[15px] font-extrabold text-[#0F766E] hover:underline">
            {o.orderNumber}
          </Link>
          <p className="text-xs text-[#64748B]">
            Placed: <span className="font-bold text-[#1E293B]">{placed}</span>
            {o.estimatedDeliveryTime ? ` • ETA: ${o.estimatedDeliveryTime}` : ""}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-bold shrink-0" style={{ backgroundColor: st.bg, borderColor: st.border, color: st.text }}>
          <st.icon className="w-3 h-3" /> {st.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1">
        {/* Rider */}
        <div className={`flex items-center gap-3 rounded-lg border p-2.5 ${rider ? "bg-[#F0FDFA] border-[#CCFBF1]" : "bg-[#FFFBEB] border-[#FDE68A]"}`}>
          <span className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center shrink-0">
            <Bike className="w-[18px] h-[18px]" style={{ color: rider ? "#0F766E" : "#94A3B8" }} />
          </span>
          <div className="min-w-0">
            {rider ? (
              <>
                <p className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-[#0F172A] truncate">{rider.fullName || rider.name || "Delivery Partner"}</span>
                  {rider.metrics?.rating ? (
                    <span className="inline-flex items-center gap-0.5 px-1 rounded bg-[#FEF3C7] text-[10px] font-bold text-[#92400E]">
                      <Star className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" /> {Number(rider.metrics.rating).toFixed(1)}
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[#64748B] truncate">
                  {rider.phone || "No Phone"} • {rider.vehicleDetails?.vehicleType || "Motorbike"}
                  {plate ? ` (${plate})` : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-[#92400E]">Searching Delivery Partner...</p>
                <p className="text-xs text-[#B45309]">Automated dispatch is locating the nearest active rider</p>
              </>
            )}
          </div>
        </div>

        {/* Customer & destination */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1E293B]">
              Deliver to: {o.customer?.name || "Customer"}
              {o.deliveryAddress?.phone ? ` (${o.deliveryAddress.phone})` : ""}
            </p>
            <p className="text-xs text-[#64748B] line-clamp-2">{o.deliveryAddress?.addressLine || "Kathmandu Address"}</p>
          </div>
        </div>

        {/* Items & payment */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#F8FAFC] px-3 py-2">
          <span className="text-xs font-bold text-[#334155]">
            📦 {o.totalCount || o.items?.length || 1} Item(s) • Total: NPR {o.totalAmount}
          </span>
          <span className="text-xs text-[#64748B]">
            {o.paymentMethod || "COD"} ({o.paymentStatus || "pending"})
          </span>
        </div>
      </div>

      {/* Footer: handover OTP & actions */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F8FAFC] border-t border-[#F1F5F9]">
        {o.vendorPickupOtp ? (
          pickedUp ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Package Handed Over
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F766E]">Handover OTP:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#CCFBF1] text-base font-black tracking-[1.5px] text-[#0F766E]">{o.vendorPickupOtp}</span>
            </span>
          )
        ) : (
          <span className="text-xs text-[#94A3B8]">OTP ready upon dispatch</span>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {rider?.phone ? (
            <a href={`tel:${rider.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#0F766E] text-white text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5" /> Call Rider
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#94A3B8] text-xs font-semibold" aria-disabled="true">
              <Clock className="w-3.5 h-3.5" /> Awaiting Rider
            </span>
          )}
          {customerPhone && o.deliveryAddress?.phone ? (
            <a
              href={`tel:${customerPhone.replace(/[^0-9+]/g, "")}`}
              className="w-8 h-8 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] flex items-center justify-center"
              aria-label={`Call customer ${o.customer?.name || ""}`.trim()}
              title="Call Customer"
            >
              <User className="w-3.5 h-3.5 text-[#0F766E]" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
