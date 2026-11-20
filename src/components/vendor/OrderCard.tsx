"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, MapPin, User } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { changeOrderStatus } from "@/redux/slices/vendorSlice";
import type { SellerOrder } from "@/lib/seller/types";
import { DECLINE_REASONS, formatTime, npr, orderStatusBadge } from "@/lib/seller/format";
import { Pill, btn } from "@/components/vendor/ui";

/** Mirrors the app's VendorOrderItemCard */
export default function OrderCard({ order }: { order: SellerOrder }) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badge = orderStatusBadge(order.orderStatus);
  const customerName = order.customer?.name || order.customerName || "Customer";
  const customerPhone = order.customer?.phone || order.customerPhone || order.deliveryAddress?.phone || "N/A";
  const address = order.deliveryAddress?.addressLine || "—";
  const href = `/seller/dashboard/orders/${order._id}`;

  const update = async (status: string, reason?: string) => {
    setBusy(true);
    setError(null);
    const r = await dispatch(changeOrderStatus({ orderId: order._id, status, reason }));
    setBusy(false);
    setDeclining(false);
    if (changeOrderStatus.rejected.match(r)) setError((r.payload as string) || "Could not update order status.");
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <Link href={href} className="block p-4 hover:bg-slate-50/60 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-vendor-dark flex items-center gap-1">
              {order.orderNumber}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {formatTime(order.createdAt)} · {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Pill badge={badge} />
        </div>

        <div className="mt-3 space-y-1.5 text-xs">
          <p className="flex items-center gap-2 text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">{customerName}</span>
            <span className="text-slate-500">({customerPhone})</span>
          </p>
          <p className="flex items-start gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </p>
        </div>

        {/* Item summaries for kitchen / fulfilment */}
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-600">
          {order.items?.slice(0, 3).map((it, i) => (
            <p key={it._id || i} className="flex justify-between gap-2">
              <span className="truncate">
                {it.quantity} × {it.name}
              </span>
              <span className="shrink-0 text-slate-500">{npr(it.price * it.quantity)}</span>
            </p>
          ))}
          {order.items?.length > 3 && <p className="text-[11px] text-slate-400 mt-0.5">+{order.items.length - 3} more item(s)</p>}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-500">{order.paymentMethod || "Cash on delivery"}</span>
          <span className="text-base font-extrabold text-slate-900">{npr(order.totalAmount)}</span>
        </div>
      </Link>

      {/* Action buttons — same transitions as the app */}
      <div className="px-4 pb-4 mt-auto">
        {error && <p className="text-xs text-red-600 font-medium mb-2">{error}</p>}
        {order.orderStatus === "PLACED" &&
          (declining ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DECLINE_REASONS.map((r) => (
                <button key={r} type="button" disabled={busy} onClick={() => update("REJECTED", r)} className={btn.danger}>
                  {r}
                </button>
              ))}
              <button type="button" onClick={() => setDeclining(false)} className={btn.ghost}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => setDeclining(true)} className={btn.danger}>
                Reject
              </button>
              <button type="button" disabled={busy} onClick={() => update("ACCEPTED")} className={btn.primary}>
                {busy ? "Updating…" : "Accept Order"}
              </button>
            </div>
          ))}
        {(order.orderStatus === "ACCEPTED" || order.orderStatus === "PREPARING") && (
          <button type="button" disabled={busy} onClick={() => update("READY_FOR_PICKUP")} className={`${btn.success} w-full`}>
            {busy ? "Updating…" : "Mark Order Ready"}
          </button>
        )}
        {order.orderStatus === "READY_FOR_PICKUP" && (
          <p className="text-center text-xs font-bold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg py-2.5">
            Waiting for Delivery Partner{order.vendorPickupOtp ? ` · Pickup OTP ${order.vendorPickupOtp}` : ""}
          </p>
        )}
        {order.orderStatus === "OUT_FOR_DELIVERY" && (
          <p className="text-center text-xs font-bold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] rounded-lg py-2.5">
            Out for Delivery · En route to customer
          </p>
        )}
        {order.orderStatus === "DELIVERED" && (
          <p className="text-center text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg py-2.5">
            Order Delivered Successfully
          </p>
        )}
        {(order.orderStatus === "REJECTED" || order.orderStatus === "CANCELLED") && (
          <p className="text-center text-xs font-bold text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg py-2.5">
            Declined / Cancelled{order.rejectionReason ? ` · ${order.rejectionReason}` : ""}
          </p>
        )}
      </div>
    </article>
  );
}
