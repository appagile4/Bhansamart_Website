"use client";

import React from "react";
import Link from "next/link";
import { Bike, ChevronRight, MapPin, Package, Receipt, RotateCcw, Store, User } from "lucide-react";
import { getOrderDetail } from "@/lib/admin/orderDetail";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate, formatDateTime, npr, orderStatusBadge, refundStatusBadge } from "@/lib/seller/format";
import { useConsole } from "@/lib/admin/console";
import { ErrorBanner, LoadingBlock, Modal, Pill } from "./ui";

/** app: staffadminScreens/OrdersScreen — "Fulfillment, Partner & Financial Audit" order modal */
export default function OrderDetailModal({ orderId, orderNumber, onClose }: { orderId: string; orderNumber: string; onClose: () => void }) {
  const { base } = useConsole();
  const q = useAsync(() => getOrderDetail(orderId), orderId);
  const o = q.data;

  return (
    <Modal
      open
      wide
      title={
        <span>
          Order #{o?.orderNumber || orderNumber}
          <span className="block text-xs font-medium text-slate-500">Fulfillment, partner & financial audit</span>
        </span>
      }
      onClose={onClose}
    >
      {q.error ? (
        <ErrorBanner message={q.error} onRetry={q.reload} />
      ) : q.loading && !o ? (
        <LoadingBlock text="Loading order…" />
      ) : o ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
            <Pill badge={orderStatusBadge(o.orderStatus)} />
            <span className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</span>
            <span className="text-sm font-extrabold text-slate-900">
              {npr(o.totalAmount)} <span className="text-xs font-medium text-slate-500">({o.paymentMethod})</span>
            </span>
            <span className={`text-[11px] font-bold uppercase ${o.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{o.paymentStatus || "pending"}</span>
          </div>

          <Section
            icon={User}
            title="Customer details"
            action={
              o.customer?._id ? (
                <Link href={`${base}/customers/${o.customer._id}`} className="inline-flex items-center gap-0.5 text-xs font-bold text-[#0284C7] hover:underline">
                  View customer <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : null
            }
          >
            <Facts rows={[["Name", o.customer?.name || "Customer"], ["Email", o.customer?.email], ["Phone", o.customer?.phone || o.deliveryAddress?.phone]]} />
            {o.customerInsights && (
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <Mini label="Orders done" value={String(o.customerInsights.totalCompletedOrders ?? 0)} />
                <Mini label="Lifetime spend" value={npr(o.customerInsights.totalCompletedSpending || 0)} />
                <Mini label="Last purchase" value={o.customerInsights.lastPurchaseDate ? formatDate(o.customerInsights.lastPurchaseDate) : "—"} />
              </div>
            )}
            {o.deliveryAddress && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                {[o.deliveryAddress.houseNo, o.deliveryAddress.street, o.deliveryAddress.addressLine, o.deliveryAddress.landmark, o.deliveryAddress.city].filter(Boolean).join(", ")}
                {o.deliveryAddress.phone ? ` · ${o.deliveryAddress.phone}` : ""}
              </p>
            )}
          </Section>

          <Section icon={Store} title="Vendor store details">
            <Facts
              rows={[
                ["Store", o.vendor?.businessDetails?.businessName || "Assigned store"],
                ["Phone", o.vendor?.businessDetails?.businessPhone || o.vendor?.sellerDetails?.sellerPhone],
                ["Warehouse", o.vendor?.shippingLocations?.warehouseAddress],
              ]}
            />
          </Section>

          <Section icon={Bike} title="Delivery partner assignment">
            {!o.assignedDeliveryBoy ? (
              <p className="text-xs text-slate-500">Not assigned · no delivery partner assigned yet.</p>
            ) : (
              <Facts
                rows={[
                  ["Rider", o.assignedDeliveryBoy.fullName || "Delivery partner"],
                  ["Phone", o.assignedDeliveryBoy.phone],
                  ["Assignment", o.deliveryAssignments?.[0]?.status || (o.deliveredAt ? "COMPLETED" : "ASSIGNED")],
                  ["Rider earning", o.deliveryEarning != null ? npr(o.deliveryEarning) : undefined],
                  ["Delivered at", o.deliveredAt ? formatDateTime(o.deliveredAt) : undefined],
                ]}
              />
            )}
          </Section>

          {!!o.items?.length && (
            <Section icon={Package} title={`Ordered items (${o.items.length})`}>
              <ul className="divide-y divide-slate-100">
                {o.items.map((it, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 text-xs">
                    <span className="min-w-0">
                      <span className="font-bold text-slate-800">
                        {it.quantity}× {it.name || it.productName || "Product"}
                      </span>
                      <span className="block text-slate-500">Unit {npr(it.price)}</span>
                    </span>
                    <span className="font-bold text-slate-900">{npr((it.price || 0) * (it.quantity || 1))}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-xs">
                <Row label="Items total" value={npr(o.itemsTotal ?? o.totalAmount)} />
                {!!o.deliveryCharge && <Row label="Delivery charge" value={npr(o.deliveryCharge)} />}
                {!!o.discount && <Row label="Discount" value={`− ${npr(o.discount)}`} />}
                <Row label="Grand total" value={npr(o.totalAmount)} bold />
              </div>
            </Section>
          )}

          <Section icon={Receipt} title="COD & financial tracking">
            {o.paymentMethod === "Cash on delivery" ? (
              <>
                <Facts
                  rows={[
                    ["Amount due", npr(o.codTracking?.amountDue ?? o.codDetails?.amountDue ?? o.totalAmount)],
                    ["Collected", npr(o.codTracking?.amountCollected ?? o.codDetails?.amountCollected ?? 0)],
                    ["COD status", o.codTracking?.status || o.codDetails?.status || "COD_PENDING"],
                    [
                      "Handover",
                      o.codTracking?.vendorConfirmed ? "Confirmed by vendor" : o.codTracking?.handoverReceipt ? `Submitted (${o.codTracking.handoverReceipt})` : "Pending cash handover",
                    ],
                  ]}
                />
                {o.codTracking?.discrepancy?.hasDiscrepancy && (
                  <p className="mt-2 text-xs font-semibold text-red-700 bg-red-50 rounded-lg px-3 py-2">
                    Discrepancy: shortfall of {npr(o.codTracking.discrepancy.shortfall || 0)}. Reason: {o.codTracking.discrepancy.reason || "—"}
                  </p>
                )}
              </>
            ) : (
              <Facts rows={[["Method", o.paymentMethod], ["Payment status", o.paymentStatus], ["Gateway transaction", o.paymentDetails?.gatewayTransactionId]]} />
            )}
          </Section>

          <Section icon={RotateCcw} title="Returns, refunds & exchanges">
            {!o.refunds?.length ? (
              <p className="text-xs text-slate-500">No return, refund, or exchange claims filed for this order.</p>
            ) : (
              <ul className="space-y-2">
                {o.refunds.map((r) => (
                  <li key={r._id} className="rounded-lg border border-slate-100 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Claim #{r.refundNumber || r._id.slice(-8)}</span>
                      <Pill badge={refundStatusBadge(r.status)} />
                    </div>
                    <p className="text-slate-600 mt-1">
                      Reason: {r.reason || "Customer requested refund"} · <span className="font-bold">{npr(r.amount ?? r.totalAmount ?? 0)}</span>
                    </p>
                    {r.customerPayoutDetails && (
                      <p className="text-slate-500">
                        Payout: {r.customerPayoutDetails.method || "Direct payout"}
                        {r.customerPayoutDetails.upiId || r.customerPayoutDetails.accountNumber ? ` (${r.customerPayoutDetails.upiId || r.customerPayoutDetails.accountNumber})` : ""}
                      </p>
                    )}
                    {r.vendorPaymentDetails?.transactionReference && <p className="text-slate-500">Vendor payment ref: {r.vendorPaymentDetails.transactionReference}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}
    </Modal>
  );
}

function Section({ icon: Icon, title, action, children }: { icon: React.ElementType; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-100 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-600">
          <Icon className="w-4 h-4 text-[#0284C7]" /> {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: Array<[string, string | undefined | null]> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2 text-xs">
            <dt className="text-slate-500 shrink-0">{k}</dt>
            <dd className="font-semibold text-slate-800 text-right break-words [overflow-wrap:anywhere] min-w-0">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 py-2">
    <p className="text-sm font-extrabold text-slate-900">{value}</p>
    <p className="text-[10px] text-slate-500">{label}</p>
  </div>
);

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className={`flex justify-between ${bold ? "font-extrabold text-slate-900 text-sm" : "text-slate-600"}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
