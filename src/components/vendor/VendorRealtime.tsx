"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, Loader2, X } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import {
  changeOrderStatus,
  dismissNewOrderAlert,
  fetchCodSummary,
  fetchVendorNotifications,
  fetchVendorOrders,
  fetchVendorStats,
  orderPatched,
  orderReceived,
  setLiveConnected,
} from "@/redux/slices/vendorSlice";
import { connectVendorSocket, disconnectVendorSocket, VENDOR_EVENTS } from "@/lib/seller/socket";
import { getVendorToken } from "@/lib/seller/api";
import type { SellerNotification, SellerOrder } from "@/lib/seller/types";
import { notificationHref } from "./VendorHeader";
import { formatTime } from "@/lib/seller/format";
import { refreshStorage } from "@/lib/seller/storage";

/** Short two-tone chime for an incoming order (browsers may block audio until the page was interacted with). */
const playChime = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.start(t);
      osc.stop(t + 0.17);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* audio unavailable */
  }
};

/**
 * Keeps the Seller Hub live (app: VendorMain/dashboard.tsx socket effects):
 * new orders, status changes, notifications, COD & wallet updates.
 */
export default function VendorRealtime() {
  const dispatch = useAppDispatch();
  const vendorToken = useVendor().vendorToken;
  const [banner, setBanner] = useState<(Partial<SellerNotification> & { key: number }) | null>(null);
  const closeBanner = useCallback(() => setBanner(null), []);

  useEffect(() => {
    const token = vendorToken || getVendorToken();
    if (!token) return;
    const socket = connectVendorSocket(token);
    if (!socket) return;

    const refreshMoney = () => {
      dispatch(fetchVendorStats());
      dispatch(fetchCodSummary());
    };
    const onConnect = () => dispatch(setLiveConnected(true));
    const onDisconnect = () => dispatch(setLiveConnected(false));
    const onNewOrder = (order: SellerOrder) => {
      dispatch(orderReceived(order));
      dispatch(fetchVendorStats());
      playChime();
    };
    const onStatus = (update: Partial<SellerOrder> & { _id: string }) => {
      dispatch(orderPatched(update));
      dispatch(fetchVendorStats());
      // rider assignment etc. are not in the status payload — refresh the list copy
      dispatch(fetchVendorOrders());
    };
    const onNotification = (notif?: Partial<SellerNotification>) => {
      dispatch(fetchVendorNotifications());
      dispatch(fetchVendorStats());
      // storage alerts (80/90/100%), recharge approved/rejected, limit changed by super admin
      if (String(notif?.data?.kind || "").startsWith("STORAGE")) refreshStorage();
      // app: InAppNotificationBanner for vendor socket notifications
      if (notif?.title || notif?.message) setBanner({ ...notif, key: Date.now() });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(VENDOR_EVENTS.newOrder, onNewOrder);
    socket.on(VENDOR_EVENTS.orderStatus, onStatus);
    socket.on(VENDOR_EVENTS.notification, onNotification);
    socket.on(VENDOR_EVENTS.notificationBroadcast, onNotification);
    socket.on(VENDOR_EVENTS.cod, refreshMoney);
    socket.on(VENDOR_EVENTS.wallet, refreshMoney);
    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(VENDOR_EVENTS.newOrder, onNewOrder);
      socket.off(VENDOR_EVENTS.orderStatus, onStatus);
      socket.off(VENDOR_EVENTS.notification, onNotification);
      socket.off(VENDOR_EVENTS.notificationBroadcast, onNotification);
      socket.off(VENDOR_EVENTS.cod, refreshMoney);
      socket.off(VENDOR_EVENTS.wallet, refreshMoney);
    };
  }, [vendorToken, dispatch]);

  // Drop the connection when the vendor logs out
  useEffect(() => {
    if (!vendorToken && !getVendorToken()) disconnectVendorSocket();
  }, [vendorToken]);

  return (
    <>
      <NewOrderModal />
      {banner && <NotificationBanner banner={banner} onClose={closeBanner} />}
    </>
  );
}

/** Slide-in toast for an incoming seller notification (app: InAppNotificationBanner, 3 s) */
function NotificationBanner({ banner, onClose }: { banner: Partial<SellerNotification> & { key: number }; onClose: () => void }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [banner.key, onClose]);

  return (
    <div className="fixed top-4 inset-x-4 sm:left-auto sm:right-4 sm:w-96 z-[70]" role="status" aria-live="polite">
      <div className="bg-white rounded-2xl shadow-2xl border border-vendor-100 p-4 flex items-start gap-3 animate-[slideIn_.25s_ease-out]">
        <span className="w-9 h-9 rounded-xl bg-vendor-soft text-vendor flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </span>
        <button
          type="button"
          className="flex-1 min-w-0 text-left cursor-pointer"
          onClick={() => {
            onClose();
            router.push(notificationHref({ _id: "", type: banner.type || "", title: "", message: "", isRead: false, createdAt: "", order: banner.order, data: banner.data }));
          }}
        >
          <p className="text-sm font-extrabold text-slate-900 truncate">{banner.title || "Vendor Notification"}</p>
          {banner.message && <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{banner.message}</p>}
        </button>
        <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** App: VendorMain/dashboard.tsx "NEW ORDER RECEIVED!" modal with quick Accept / Decline (same text & colours) */
function NewOrderModal() {
  const dispatch = useAppDispatch();
  const order = useVendor().newOrderAlert;
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const close = () => {
    setConfirmDecline(false);
    setError(null);
    dispatch(dismissNewOrderAlert());
  };

  const act = async (status: "ACCEPTED" | "REJECTED", reason?: string) => {
    setBusy(status === "ACCEPTED" ? "accept" : "decline");
    setError(null);
    const r = await dispatch(changeOrderStatus({ orderId: order._id, status, reason }));
    setBusy(null);
    if (changeOrderStatus.rejected.match(r)) {
      setError((r.payload as string) || (status === "ACCEPTED" ? "Failed to accept order" : "Failed to decline order"));
      return;
    }
    setConfirmDecline(false);
    dispatch(fetchVendorStats());
  };

  const customerName = order.customerName || order.customer?.name || "Customer";
  const customerPhone = order.customerPhone || order.deliveryAddress?.phone || "N/A";
  const items = order.items || [];
  const itemCount = (order as { totalCount?: number }).totalCount || items.length;
  const orderTime = order.createdAt ? formatTime(order.createdAt) : new Date().toLocaleTimeString();

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="new-order-title">
      <div className="w-full sm:max-w-md bg-white rounded-t-[18px] sm:rounded-[18px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#F1F5F9]">
          <span className="w-[42px] h-[42px] rounded-full bg-[#E6F4F6] flex items-center justify-center shrink-0 animate-pulse">
            <BellRing className="w-6 h-6 text-[#016073]" />
          </span>
          <div className="flex-1 min-w-0">
            <p id="new-order-title" className="text-xs font-extrabold tracking-[0.5px] text-[#059669]">NEW ORDER RECEIVED!</p>
            <p className="text-lg font-extrabold text-[#0F172A]">#{order.orderNumber || "ORDER"}</p>
          </div>
          <button type="button" onClick={close} className="p-1.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer" aria-label="Close">
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>

        {/* Order details */}
        <div className="px-5 py-4 space-y-2.5 text-sm">
          <DetailRow label="Customer:" value={customerName} />
          <DetailRow label="Contact:" value={customerPhone} />
          <DetailRow label="Total Amount:" value={`NPR ${order.totalAmount}`} strong />
          <DetailRow label="Payment Method:" value={order.paymentMethod || "Cash on delivery"} />
          <DetailRow label="Order Time:" value={orderTime} />

          {items.length > 0 && (
            <div className="rounded-lg bg-[#F8FAFC] px-3 py-2.5">
              <p className="text-xs font-bold text-[#475569] mb-1">Items ({itemCount}):</p>
              {items.slice(0, 3).map((it, i) => (
                <p key={it._id || i} className="text-xs text-[#334155] truncate">
                  • {it.name} × {it.quantity}
                </p>
              ))}
              {items.length > 3 && <p className="text-xs text-[#64748B]">+{items.length - 3} more items...</p>}
            </div>
          )}

          {error && <p className="text-xs font-medium text-[#DC2626]" role="alert">{error}</p>}
        </div>

        {/* Quick actions */}
        <div className="px-5 pb-5">
          {confirmDecline ? (
            <div className="rounded-xl border border-[#FEE2E2] p-3 space-y-3">
              <p className="text-sm font-bold text-[#0F172A]">Decline Order</p>
              <p className="text-xs text-[#475569]">Are you sure you want to decline this customer order?</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" disabled={busy !== null} onClick={() => setConfirmDecline(false)} className="h-10 rounded-[10px] bg-[#F1F5F9] text-[#475569] text-sm font-bold cursor-pointer disabled:opacity-60">
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => act("REJECTED", "Store busy / out of stock")}
                  className="h-10 rounded-[10px] bg-[#DC2626] text-white text-sm font-bold cursor-pointer disabled:opacity-60"
                >
                  {busy === "decline" ? "Declining…" : "Decline"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setConfirmDecline(true)}
                className="h-11 rounded-[10px] bg-[#FEE2E2] text-[#DC2626] text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <X className="w-4 h-4" /> Decline
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act("ACCEPTED")}
                className="h-11 rounded-[10px] bg-[#016073] hover:bg-[#014c5c] text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {busy === "accept" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Accept Order
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[#64748B]">{label}</span>
      <span className={`text-right break-words ${strong ? "text-[15px] font-extrabold text-[#016073]" : "font-semibold text-[#0F172A]"}`}>{value}</span>
    </div>
  );
}
