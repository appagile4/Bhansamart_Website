"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, RefreshCw, Search } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchVendorOrders } from "@/redux/slices/vendorSlice";
import OrderCard from "@/components/vendor/OrderCard";
import { ORDER_TABS, OrderTabKey, orderMatchesTab, toOrderTab } from "@/lib/seller/format";
import { EmptyState, LoadingBlock, PageHeader, Tabs, btn } from "@/components/vendor/ui";

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading orders…" />}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const { orders, ordersLoading, ordersLoaded } = useVendor();

  const tab = toOrderTab(params.get("status") || params.get("tab"));
  const [query, setQuery] = useState("");

  const setTab = (key: OrderTabKey) => router.replace(key === "all" ? "/seller/dashboard/orders" : `/seller/dashboard/orders?status=${key}`);

  const counts = useMemo(() => {
    const c = {} as Record<OrderTabKey, number>;
    ORDER_TABS.forEach((t) => {
      c[t.key] = orders.filter((o) => orderMatchesTab(o.orderStatus, t.key)).length;
    });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!orderMatchesTab(o.orderStatus, tab)) return false;
      if (!q) return true;
      const name = (o.customer?.name || o.customerName || "").toLowerCase();
      const phone = o.customer?.phone || o.deliveryAddress?.phone || "";
      return o.orderNumber.toLowerCase().includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [orders, tab, query]);

  return (
    <>
      <PageHeader
        title="Order Management"
        subtitle="Accept, prepare and hand over orders — new orders appear here instantly."
        actions={
          <button type="button" onClick={() => dispatch(fetchVendorOrders())} className={btn.outline} disabled={ordersLoading}>
            <RefreshCw className={`w-4 h-4 ${ordersLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order # or customer..."
            aria-label="Search orders"
            className="w-full h-11 bg-white text-sm pl-10 pr-4 rounded-xl border border-slate-200 focus:border-vendor-dark focus:ring-2 focus:ring-vendor-100 focus:outline-none"
          />
        </div>

        <Tabs tabs={ORDER_TABS} active={tab} onChange={setTab} counts={counts} />

        {!ordersLoaded && ordersLoading ? (
          <LoadingBlock text="Loading orders…" />
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState
              icon={Package}
              title="No Orders Found"
              text={query ? "No orders match your search." : "Orders in this stage will appear here as customers place them."}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {visible.map((o) => (
              <OrderCard key={o._id} order={o} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
