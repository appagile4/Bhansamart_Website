"use client";

import React, { useMemo, useState } from "react";
import { Mail, MapPin, Phone, RefreshCw, Search, Users } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate, initials, npr } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, Tabs, btn } from "@/components/vendor/ui";

// app: cusotmer.tsx filter chips
const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "cancelled", label: "Has Cancellations" },
  { key: "top_buyers", label: "Top Buyers" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default function CustomersPage() {
  const { data, error, loading, reload } = useAsync(() => api.getCustomers(), "customers");
  const customers = useMemo(() => data || [], [data]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const summary = useMemo(
    () => ({
      customers: customers.length,
      orders: customers.reduce((n, c) => n + (c.orderCount || 0), 0),
      products: customers.reduce((n, c) => n + (c.productCount || 0), 0),
      cancelled: customers.reduce((n, c) => n + (c.cancelledCount || 0), 0),
    }),
    [customers]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = customers.filter((c) => !q || [c.name, c.phone, c.email].some((f) => (f || "").toLowerCase().includes(q)));
    if (filter === "active") list = list.filter((c) => c.orderCount - c.cancelledCount > 0);
    if (filter === "cancelled") list = list.filter((c) => c.cancelledCount > 0);
    if (filter === "top_buyers") list = [...list].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0));
    return list;
  }, [customers, filter, search]);

  return (
    <>
      <PageHeader
        title="Store Customers"
        subtitle="Customer purchase & order history with your store."
        actions={
          <button type="button" onClick={reload} className={btn.outline} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Customers" value={summary.customers} />
          <StatCard label="Store Orders" value={summary.orders} />
          <StatCard label="Products Sold" value={summary.products} />
          <StatCard label="Cancelled" value={summary.cancelled} />
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            aria-label="Search customers"
            className="w-full h-11 bg-white text-sm pl-10 pr-4 rounded-xl border border-slate-200 focus:border-vendor-dark focus:ring-2 focus:ring-vendor-100 focus:outline-none"
          />
        </div>

        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />

        {error && <ErrorBanner message={error} onRetry={reload} />}

        {loading && !data ? (
          <LoadingBlock text="Fetching store customers…" />
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState icon={Users} title="No customers yet" text="Customers who order from your store will be listed here." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {visible.map((c) => (
              <article key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-tr from-vendor to-vendor-accent text-white font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {c.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(c.name)
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.name || "Customer"}</p>
                    {c.email && (
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                    )}
                  </div>
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className={`${btn.outline} h-9 px-3`} aria-label={`Call ${c.name}`}>
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Total Orders", c.orderCount],
                    ["Products Bought", c.productCount],
                    ["Cancelled", c.cancelledCount],
                  ].map(([k, val]) => (
                    <div key={k} className="rounded-xl bg-slate-50 py-2">
                      <p className="text-base font-extrabold text-slate-900">{val}</p>
                      <p className="text-[10px] text-slate-500">{k}</p>
                    </div>
                  ))}
                </div>
                {c.lastAddress && (
                  <p className="text-[11px] text-slate-500 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {c.lastAddress}
                  </p>
                )}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    Total Purchases: <span className="font-extrabold text-slate-900">{npr(c.totalSpent)}</span>
                  </span>
                  <span className="text-slate-400">Last order {formatDate(c.lastOrderDate)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
