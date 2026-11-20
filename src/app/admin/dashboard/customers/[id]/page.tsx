"use client";

import React, { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { useConsole } from "@/lib/admin/console";
import { Mail, Phone } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate, formatDateTime, initials, npr, orderStatusBadge, refundStatusBadge } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader, Pill, StatCard } from "@/components/admin/ui";

const TABS = ["Orders", "Top Products", "Stores", "Delivery Partners", "COD History", "Refunds"] as const;
const td = "px-5 py-3 whitespace-nowrap";

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            {head.map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

/** app: Screens/staffadminScreens/customerdetails.tsx */
export default function CustomerDetailsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading customer…" />}>
      <CustomerView />
    </Suspense>
  );
}

function CustomerView() {
  const { staff, base } = useConsole();
  const { id } = useParams<{ id: string }>();
  const q = useAsync(() => api.getCustomerDetails(id), id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Orders");
  const d = q.data;
  if (q.loading && !d) return <LoadingBlock text="Loading customer…" />;
  if (!d) return <ErrorBanner message={q.error || "Customer not found."} onRetry={q.reload} />;
  const c = d.customer;
  const m = d.metrics;

  const body = () => {
    switch (tab) {
      case "Orders":
        return d.orders.length === 0 ? <EmptyState title="No orders" /> : (
          <Table head={["Order", "Store", "Rider", "Amount", "Payment", "Status", "Placed"]}>
            {d.orders.map((o) => (
              <tr key={o._id}>
                <td className={`${td} font-bold`}>{o.orderNumber}</td>
                <td className={td}>{o.vendor?.businessDetails?.businessName || "—"}</td>
                <td className={td}>{o.assignedDeliveryBoy?.fullName || "—"}</td>
                <td className={`${td} font-bold`}>{npr(o.totalAmount)}</td>
                <td className={td}>{o.paymentMethod} · <span className="uppercase text-[11px]">{o.paymentStatus}</span></td>
                <td className={td}><Pill badge={orderStatusBadge(o.orderStatus)} /></td>
                <td className={`${td} text-xs text-slate-500`}>{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        );
      case "Top Products":
        return d.mostPurchasedProducts.length === 0 ? <EmptyState title="No purchases" /> : (
          <Table head={["Product", "Quantity", "Orders", "Spent"]}>
            {d.mostPurchasedProducts.map((p) => (
              <tr key={p.productId}>
                <td className={td}>
                  <span className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover" /> : null}
                    {p.name}
                  </span>
                </td>
                <td className={td}>{p.totalQuantity}</td>
                <td className={td}>{p.orderCount}</td>
                <td className={`${td} font-bold`}>{npr(p.totalSpent)}</td>
              </tr>
            ))}
          </Table>
        );
      case "Stores":
        return d.vendorSpendingSummary.length === 0 ? <EmptyState title="No stores" /> : (
          <Table head={["Store", "Orders", "Delivered", "Spent"]}>
            {d.vendorSpendingSummary.map((v) => (
              <tr key={v.vendorId}>
                <td className={`${td} font-semibold`}>{v.businessName}</td>
                <td className={td}>{v.orderCount}</td>
                <td className={td}>{v.completedCount}</td>
                <td className={`${td} font-bold`}>{npr(v.totalSpent)}</td>
              </tr>
            ))}
          </Table>
        );
      case "Delivery Partners":
        return d.deliveryHistory.length === 0 ? <EmptyState title="No deliveries" /> : (
          <Table head={["Rider", "Phone", "Deliveries", "Last delivery"]}>
            {d.deliveryHistory.map((r) => (
              <tr key={r.deliveryBoyId}>
                <td className={`${td} font-semibold`}>{r.fullName}</td>
                <td className={td}>{r.phone || "—"}</td>
                <td className={td}>{r.deliveriesCount}</td>
                <td className={`${td} text-xs text-slate-500`}>{formatDateTime(r.lastDeliveryAt)}</td>
              </tr>
            ))}
          </Table>
        );
      case "COD History":
        return d.codHistory.length === 0 ? <EmptyState title="No cash-on-delivery orders" /> : (
          <Table head={["Order", "Due", "Collected", "Status", "Vendor confirmed", "Date"]}>
            {d.codHistory.map((o) => (
              <tr key={o.orderId}>
                <td className={`${td} font-semibold`}>{o.orderNumber}</td>
                <td className={td}>{npr(o.amountDue)}</td>
                <td className={td}>{npr(o.amountCollected)}</td>
                <td className={td}>{o.status.replace(/_/g, " ")}</td>
                <td className={td}>{o.vendorConfirmed ? "Yes" : "No"}</td>
                <td className={`${td} text-xs text-slate-500`}>{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        );
      case "Refunds":
        return d.refunds.length === 0 ? <EmptyState title="No refund claims" /> : (
          <Table head={["Claim", "Order", "Store", "Reason", "Amount", "Status", "Date"]}>
            {d.refunds.map((r) => (
              <tr key={r._id}>
                <td className={`${td} font-semibold`}>{r.refundNumber || r._id.slice(-6)}</td>
                <td className={td}>{r.order?.orderNumber || "—"}</td>
                <td className={td}>{r.vendor?.businessDetails?.businessName || "—"}</td>
                <td className={`${td} max-w-xs truncate`}>{r.reason || "—"}</td>
                <td className={`${td} font-bold`}>{npr(r.refundAmount ?? r.amount)}</td>
                <td className={td}><Pill badge={refundStatusBadge(r.status)} /></td>
                <td className={`${td} text-xs text-slate-500`}>{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </Table>
        );
    }
  };

  return (
    <>
      <PageHeader backHref={staff ? `${base}/orders` : `${base}/customers`} title={c.name} subtitle={`Customer since ${formatDate(c.createdAt)}`} />
      <div className="space-y-4">
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-sky-100 text-sky-800 font-bold text-lg flex items-center justify-center shrink-0">{initials(c.name)}</span>
          <div className="flex-1 text-sm space-y-1">
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
              <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.email || "—"}</span>
              <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.phone || "—"}</span>
            </p>
            <p className="text-xs text-slate-500">Last purchase {formatDate(m.lastPurchaseDate)} · Last login {formatDate(c.lastLoginAt)}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.isActive === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{c.isActive === false ? "Inactive" : "Active"}</span>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Orders" value={m.totalOrders} sub={`${m.activeOrders} active · ${m.cancelledOrders} cancelled`} tone="blue" />
          <StatCard label="Delivered" value={m.completedOrders} tone="green" />
          <StatCard label="Completed Spend" value={npr(m.totalCompletedSpending)} tone="violet" />
          <StatCard label="Net Spend" value={npr(m.netSpending)} sub={`${npr(m.totalRefundedAmount)} refunded`} tone="amber" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar" role="tablist">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${tab === t ? "bg-sky-700 border-sky-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-sky-600"}`}>
              {t}
            </button>
          ))}
        </div>
        <Card>{body()}</Card>
      </div>
    </>
  );
}
