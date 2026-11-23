"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bike,
  CheckCircle2,
  Clock,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  User,
  XCircle,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { changeOrderStatus } from "@/redux/slices/vendorSlice";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { RefundRecord, SellerOrder } from "@/lib/seller/types";
import { DECLINE_REASONS, formatDateTime, npr, orderStatusBadge, refundStatusBadge } from "@/lib/seller/format";
import { Card, ErrorBanner, LoadingBlock, Modal, PageHeader, Pill, SuccessBanner, btn, field, fieldLabel } from "@/components/vendor/ui";

// app: TIMELINE_STEPS
const TIMELINE = [
  { key: "PLACED", label: "Order Placed", match: ["PLACED"] },
  { key: "ACCEPTED", label: "Store Accepted", match: ["ACCEPTED", "PREPARING"] },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", match: ["READY_FOR_PICKUP"] },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", match: ["OUT_FOR_DELIVERY"] },
  { key: "DELIVERED", label: "Delivered", match: ["DELIVERED"] },
];

const stepIndex = (status: string) => TIMELINE.findIndex((s) => s.match.includes(status));

export default function OrderDetailsPage() {
  // useParams() reads URL data — it must sit under a Suspense boundary for prerendering
  return (
    <Suspense fallback={<LoadingBlock text="Loading order details…" />}>
      <OrderDetailsView />
    </Suspense>
  );
}

function OrderDetailsView() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { data: order, error, loading, reload, setData } = useAsync(() => api.getOrderById(id), id);

  // Live: when the socket patches this order's status in the store, reload the full document
  const liveStatus = useVendor().orders.find((o) => o._id === id)?.orderStatus;
  const lastLive = useRef(liveStatus);
  useEffect(() => {
    if (liveStatus && lastLive.current && liveStatus !== lastLive.current) reload();
    lastLive.current = liveStatus;
  }, [liveStatus, reload]);

  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading && !order) return <LoadingBlock text="Loading order details…" />;
  if (!order) return <ErrorBanner message={error || "Order not found."} onRetry={reload} />;

  const badge = orderStatusBadge(order.orderStatus, true);
  const customerName = order.customer?.name || order.customerName || "Customer";
  const customerPhone = order.customer?.phone || order.deliveryAddress?.phone || order.customerPhone || "";
  const customerEmail = order.customer?.email || "";
  const rider = order.assignedDeliveryBoy;
  const pickupOtp = order.vendorPickupOtp;
  const active = stepIndex(order.orderStatus);
  const cancelled = order.orderStatus === "REJECTED" || order.orderStatus === "CANCELLED";

  const updateStatus = async (status: string, reason?: string) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    const r = await dispatch(changeOrderStatus({ orderId: order._id, status, reason }));
    setBusy(false);
    setDeclining(false);
    if (changeOrderStatus.rejected.match(r)) {
      setActionError((r.payload as string) || "Could not update order status.");
      return;
    }
    setData((prev) => (prev ? { ...prev, orderStatus: status as SellerOrder["orderStatus"], rejectionReason: reason || prev.rejectionReason } : prev));
    setNotice(`Order status changed to ${status.replace(/_/g, " ").toLowerCase()}.`);
    reload();
  };

  const historyTime = (keys: string[]) =>
    order.statusHistory?.slice().reverse().find((h) => keys.includes(h.status))?.timestamp;

  return (
    <div>
      <PageHeader
        backHref="/seller/dashboard/orders"
        title={`Order #${order.orderNumber}`}
        subtitle={formatDateTime(order.createdAt)}
        actions={
          <>
            <Pill badge={badge} className="text-xs py-1" />
            <button type="button" onClick={reload} className={btn.ghost} aria-label="Refresh order">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {actionError && <ErrorBanner message={actionError} />}

        {/* Pickup OTP */}
        {pickupOtp && ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.orderStatus) && (
          <div className="rounded-2xl border border-vendor-200 bg-vendor-soft p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-vendor" />
              <div>
                <p className="text-sm font-extrabold text-vendor-dark">Store Pickup OTP</p>
                <p className="text-xs text-slate-600">Rider must verify this code before taking the package</p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-xl bg-white border-2 border-dashed border-vendor text-2xl font-extrabold tracking-[0.3em] text-vendor-dark">
              {pickupOtp}
            </span>
          </div>
        )}

        {cancelled && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-extrabold text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-700 mt-0.5">Reason: {order.rejectionReason || "Declined by store."}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Customer */}
            <Card title="Customer Information">
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-full bg-vendor-soft text-vendor flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{customerName}</p>
                      <p className="text-xs text-slate-500 truncate">{[customerPhone, customerEmail].filter(Boolean).join(" · ") || "No contact details"}</p>
                    </div>
                  </div>
                  {customerPhone && (
                    <a href={`tel:${customerPhone}`} className={btn.outline}>
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-vendor mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Delivery Destination</p>
                    <p className="text-slate-600 mt-0.5">
                      {[order.deliveryAddress?.houseNo, order.deliveryAddress?.addressLine, order.deliveryAddress?.city].filter(Boolean).join(", ") || "—"}
                    </p>
                    {order.deliveryAddress?.landmark && <p className="text-slate-500 mt-0.5">Landmark: {order.deliveryAddress.landmark}</p>}
                  </div>
                </div>
              </div>
            </Card>

            {order.refundDetails && <RefundClaimCard order={order} refund={order.refundDetails} onChanged={reload} />}

            {/* Delivery partner */}
            <Card title="Delivery Partner Dispatch">
              <div className="p-5">
                {rider ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Bike className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{rider.fullName || rider.name || "Delivery Partner"}</p>
                        <p className="text-xs text-slate-500">
                          {rider.vehicleDetails?.vehicleType || "Motorcycle"}
                          {rider.vehicleDetails?.registrationNumber ? ` • ${rider.vehicleDetails.registrationNumber}` : ""}
                          {rider.metrics?.completedDeliveries !== undefined ? ` • ${rider.metrics.completedDeliveries} completed deliveries` : ""}
                        </p>
                      </div>
                    </div>
                    {rider.phone && (
                      <a href={`tel:${rider.phone}`} className={btn.outline}>
                        <Phone className="w-4 h-4" /> Call
                      </a>
                    )}
                  </div>
                ) : ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP"].includes(order.orderStatus) ? (
                  <p className="flex items-center gap-2 text-xs text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-vendor" />
                    Searching for the nearest delivery partner…
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">No delivery partner assigned.</p>
                )}
              </div>
            </Card>

            {/* Items */}
            <Card title={`Ordered Items (${order.items?.length || 0})`} action={<span className="text-xs text-slate-500">Total Units: {order.totalCount || order.items?.reduce((n, i) => n + i.quantity, 0) || 0}</span>}>
              <ul className="divide-y divide-slate-100">
                {order.items?.length ? (
                  order.items.map((it, i) => (
                    <li key={it._id || i} className="px-5 py-3 flex items-center gap-3">
                      <span className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-300" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{it.name}</p>
                        <p className="text-xs text-slate-500">
                          {npr(it.price)} × {it.quantity}
                          {it.weight ? ` · ${it.weight}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{npr(it.price * it.quantity)}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-5 py-6 text-xs text-slate-500">No items data available.</li>
                )}
              </ul>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Bill */}
            <Card title="Payment & Bill Breakdown">
              <div className="p-5 space-y-2.5 text-sm">
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">{order.paymentMethod || "Cash on delivery"}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                      order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus || "pending"}
                  </span>
                </div>
                <BillRow label="Items Subtotal" value={npr(order.itemsTotal ?? order.totalAmount)} />
                {!!order.deliveryCharge && <BillRow label="Delivery Charge" value={npr(order.deliveryCharge)} />}
                {!!order.handlingCharge && <BillRow label="Packaging & Handling" value={npr(order.handlingCharge)} />}
                {!!order.discount && <BillRow label="Discount" value={`-${npr(order.discount)}`} className="text-emerald-700" />}
                <div className="pt-2.5 mt-1 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">Grand Total</span>
                  <span className="text-lg font-extrabold text-vendor-dark">{npr(order.totalAmount)}</span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card title="Order Progress">
              <ol className="p-5 space-y-0">
                {TIMELINE.map((step, i) => {
                  const done = !cancelled && active >= i;
                  const at = historyTime(step.match);
                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                            done ? "bg-vendor-done border-vendor-done text-white" : "bg-white border-slate-300 text-slate-300"
                          }`}
                        >
                          {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3 h-3" />}
                        </span>
                        {i < TIMELINE.length - 1 && <span className={`w-0.5 flex-1 min-h-6 ${active > i && !cancelled ? "bg-vendor-done" : "bg-slate-200"}`} />}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-bold ${done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                        {at && <p className="text-[11px] text-slate-500">{formatDateTime(at)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky action bar — app: STICKY BOTTOM ACTION BAR */}
      <div className="sticky bottom-0 z-20 mt-6 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 bg-white/95 backdrop-blur border-t border-slate-200 px-3 sm:px-4 md:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {order.orderStatus === "PLACED" &&
            (declining ? (
              <>
                <span className="text-xs font-bold text-slate-600 mr-auto">Select a reason to decline this order:</span>
                {DECLINE_REASONS.map((r) => (
                  <button key={r} type="button" disabled={busy} onClick={() => updateStatus("REJECTED", r)} className={btn.danger}>
                    {r}
                  </button>
                ))}
                <button type="button" onClick={() => setDeclining(false)} className={btn.ghost}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button type="button" disabled={busy} onClick={() => setDeclining(true)} className={btn.danger}>
                  Decline
                </button>
                <button type="button" disabled={busy} onClick={() => updateStatus("ACCEPTED")} className={btn.primary}>
                  {busy ? "Updating…" : "Accept Order"}
                </button>
              </>
            ))}
          {(order.orderStatus === "ACCEPTED" || order.orderStatus === "PREPARING") && (
            <button type="button" disabled={busy} onClick={() => updateStatus("READY_FOR_PICKUP")} className={btn.success}>
              {busy ? "Updating…" : "Mark Order Ready for Pickup"}
            </button>
          )}
          {order.orderStatus === "READY_FOR_PICKUP" && <StatusNote cls="text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]" text="Ready for Pickup · Waiting for Rider" />}
          {order.orderStatus === "OUT_FOR_DELIVERY" && <StatusNote cls="text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]" text="Out for Delivery · En route to customer" />}
          {order.orderStatus === "DELIVERED" && <StatusNote cls="text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]" text="Order Completed & Delivered" />}
          {cancelled && <StatusNote cls="text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]" text="Order Declined / Cancelled" />}
        </div>
      </div>
    </div>
  );
}

function BillRow({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex justify-between text-slate-600 ${className}`}>
      <span>{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function StatusNote({ text, cls }: { text: string; cls: string }) {
  return <span className={`w-full sm:w-auto text-center px-4 py-2.5 rounded-lg border text-sm font-bold ${cls}`}>{text}</span>;
}

/** App: "CUSTOMER RETURN / REFUND / EXCHANGE CLAIM CARD" + COD direct payout modal */
function RefundClaimCard({ order, refund, onChanged }: { order: SellerOrder; refund: RefundRecord; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [method, setMethod] = useState<"UPI" | "BANK_TRANSFER" | "CASH">("BANK_TRANSFER");
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");

  const isCod = (order.paymentMethod || "").toLowerCase().includes("cash");
  const amount = refund.amount || order.totalAmount;
  const payout = refund.customerPayoutDetails;

  const acknowledge = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.vendorAcknowledgeClaim(refund._id);
      onChanged();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const submitPayout = async () => {
    if (!txRef.trim()) {
      setError("Please enter the UTR or Bank/UPI payment reference number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.vendorDirectRefundPayout(refund._id, { transactionReference: txRef.trim(), paymentMethod: method, notes: notes.trim() || undefined });
      setPayoutOpen(false);
      setTxRef("");
      setNotes("");
      onChanged();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-600" /> Customer {refund.claimType?.replace(/_/g, " ").toLowerCase() || "return"} claim
        </span>
      }
      action={<Pill badge={refundStatusBadge(refund.status || "REQUESTED")} />}
    >
      <div className="p-5 space-y-3 text-xs text-slate-700">
        <p>
          <span className="font-bold">Claim reason:</span> {refund.reason || "Customer requested return"}
        </p>
        {refund.description && (
          <p>
            <span className="font-bold">Note:</span> {refund.description}
          </p>
        )}
        <p>
          <span className="font-bold">Eligible refund amount:</span> <span className="text-sm font-extrabold text-slate-900">{npr(amount)}</span>
        </p>

        {refund.pickup?.status && refund.pickup.status !== "NOT_REQUIRED" && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
            <p>
              Pickup status: <span className="font-bold">{refund.pickup.status.replace(/_/g, " ")}</span>
            </p>
            {refund.inspection?.condition && (
              <p>
                Product condition: <span className="font-bold text-sky-700">{refund.inspection.condition}</span>
              </p>
            )}
            {refund.inspection?.notes && <p>Inspector notes: {refund.inspection.notes}</p>}
            {refund.pickup.isPickupChargeDebited && (
              <p className="text-red-700">
                {npr(refund.pickup.pickupCharge || 50)} return pickup fee debited from wallet (Ref: {refund.pickup.pickupChargeTxRef})
              </p>
            )}
          </div>
        )}

        {isCod ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
            <p className="text-amber-900">You received physical cash for this order. Please refund the customer directly from your business account.</p>
            {payout && (payout.upiId || payout.accountNumber) && (
              <div className="text-amber-900">
                <p className="font-bold">Customer payout destination</p>
                {payout.upiId && <p>UPI / eSewa: {payout.upiId}</p>}
                {payout.accountNumber && (
                  <p>
                    Bank: {payout.bankName} | A/C: {payout.accountNumber} | Name: {payout.accountHolderName}
                  </p>
                )}
              </div>
            )}
            {refund.status !== "COMPLETED" ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {(refund.status === "REQUESTED" || refund.status === "VENDOR_REVIEW") && (
                  <button type="button" disabled={busy} onClick={acknowledge} className={btn.outline}>
                    Acknowledge Claim
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => setPayoutOpen(true)} className={btn.primary}>
                  Complete Direct Refund
                </button>
              </div>
            ) : (
              <p className="font-bold text-emerald-700">
                Refund completed (Ref: {refund.vendorPaymentDetails?.transactionReference || "Direct Store Payment"})
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 space-y-1 text-sky-900">
            <p>This refund is executed directly by BhansaMart Super Admin. Vendors cannot issue online refunds.</p>
            <p className="font-bold">Super Admin payout status: {refund.status.replace(/_/g, " ")}</p>
            {payout?.payoutReference && <p>Reference: {payout.payoutReference}</p>}
            {(refund.status === "REQUESTED" || refund.status === "VENDOR_REVIEW") && (
              <button type="button" disabled={busy} onClick={acknowledge} className={`${btn.outline} mt-2`}>
                Acknowledge Claim
              </button>
            )}
          </div>
        )}
        {error && !payoutOpen && <p className="text-red-600 font-medium">{error}</p>}
      </div>

      <Modal
        open={payoutOpen}
        title="Complete Direct COD Refund"
        onClose={() => setPayoutOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setPayoutOpen(false)} className={btn.ghost}>
              Cancel
            </button>
            <button type="button" disabled={busy} onClick={submitPayout} className={btn.primary}>
              {busy ? "Submitting…" : "Confirm Refund Paid"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Enter the payment reference / UTR for refunding {npr(amount)} to the customer.</p>
          <div>
            <span className={fieldLabel}>Payment method</span>
            <div className="grid grid-cols-3 gap-2">
              {(["UPI", "BANK_TRANSFER", "CASH"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`h-9 rounded-lg text-[11px] font-extrabold border cursor-pointer ${
                    method === m ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600"
                  }`}
                >
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={fieldLabel}>Payment Reference / UTR Number *</span>
            <input className={field} value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="e.g. UTR 4123 5678 9012" />
          </label>
          <label className="block">
            <span className={fieldLabel}>Notes / comments (optional)</span>
            <textarea className={`${field} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>
      </Modal>
    </Card>
  );
}
