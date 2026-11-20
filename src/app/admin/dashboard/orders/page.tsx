"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Search, ShoppingBag } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime, npr, orderStatusBadge } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, Pill, Tabs, btn, field } from "@/components/admin/ui";
import OrderDetailModal from "@/components/admin/OrderDetailModal";
import { useConsole } from "@/lib/admin/console";

// app: staffadminScreens/OrdersScreen.tsx status filter
const STATUSES = [
  { key: "ALL", label: "All Orders" },
  { key: "PLACED", label: "Placed" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]["key"]>("ALL");
  const [vendorId, setVendorId] = useState("all");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ id: string; num: string } | null>(null);
  const { staff, base } = useConsole();
  const vendors = useAsync(() => api.getStoreOptions(), "order-vendors");
  const q = useAsync(
    () => api.getPlatformOrders({ status: status === "ALL" ? undefined : status, vendorId: vendorId === "all" ? undefined : vendorId, search: search || undefined, page }),
    `${status}|${vendorId}|${search}|${page}`
  );
  const td = "px-5 py-3 whitespace-nowrap";

  return (
    <>
      <PageHeader backHref={base} title={staff ? "Orders Tracking & Fulfillment" : "Platform Orders"} subtitle={`${q.data?.total ?? 0} orders across ${staff ? "your assigned stores" : "all stores"}`} />
      <div className="space-y-4">
        <form
          className="flex flex-col sm:flex-row gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(input.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search order number…" aria-label="Search orders" />
          </div>
          <select className={`${field} sm:w-64`} value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1); }} aria-label="Filter by store">
            <option value="all">{staff ? "All assigned stores" : "All stores"}</option>
            {(vendors.data?.data || []).map((v) => (
              <option key={v._id} value={v._id}>{v.businessDetails?.businessName || "Store"}</option>
            ))}
          </select>
          <button type="submit" className={btn.primary}>Search</button>
        </form>
        <div className="overflow-x-auto no-scrollbar">
          <Tabs tabs={STATUSES} active={status} onChange={(k) => { setStatus(k); setPage(1); }} />
        </div>
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        <div className="bg-white rounded-2xl border border-slate-100">
          {q.loading && !q.data ? (
            <LoadingBlock text="Loading orders…" />
          ) : !q.data?.orders.length ? (
            <EmptyState icon={ShoppingBag} title="No orders found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    {["Order", "Store", "Customer", "Rider", "Items", "Amount", "Payment", "Status", "Placed"].map((h) => (
                      <th key={h} className="px-5 py-3 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {q.data.orders.map((o) => (
                    <tr key={o._id} onClick={() => setOpen({ id: o._id, num: o.orderNumber })} className="cursor-pointer hover:bg-slate-50">
                      <td className={`${td} font-bold text-[#0284C7]`}><button type="button" className="hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); setOpen({ id: o._id, num: o.orderNumber }); }}>{o.orderNumber}</button></td>
                      <td className={td}>{o.vendor?.businessDetails?.businessName || "—"}</td>
                      <td className={td}>{o.customer?.name || "—"}<span className="block text-[11px] text-slate-400">{o.customer?.phone}</span></td>
                      <td className={td}>{o.assignedDeliveryBoy?.fullName || "—"}</td>
                      <td className={td}>{o.items?.reduce((n, i) => n + (i.quantity || 0), 0) ?? 0}</td>
                      <td className={`${td} font-bold`}>{npr(o.totalAmount)}</td>
                      <td className={td}>{o.paymentMethod} · <span className="uppercase text-[11px]">{o.paymentStatus}</span></td>
                      <td className={td}><Pill badge={orderStatusBadge(o.orderStatus)} /></td>
                      <td className={`${td} text-xs text-slate-500`}>{formatDateTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {(q.data?.pages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-slate-600">Page {page} of {q.data?.pages}</span>
            <button type="button" disabled={page >= (q.data?.pages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      {open && <OrderDetailModal orderId={open.id} orderNumber={open.num} onClose={() => setOpen(null)} />}
    </>
  );
}
