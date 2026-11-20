"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { ProductPerformance } from "@/lib/admin/types";
import { formatDate, npr } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, Tabs, field } from "@/components/admin/ui";

// app: staffadminScreens/ProductsScreen.tsx — assigned-store products with stock filter (low stock = 1–5 units)
const STOCK = [
  { key: "ALL", label: "All" },
  { key: "IN_STOCK", label: "In Stock" },
  { key: "LOW_STOCK", label: "Low Stock" },
  { key: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;
type Stock = (typeof STOCK)[number]["key"];

const stockState = (n: number) => (n <= 0 ? { label: "Out of stock", cls: "bg-red-50 text-red-700" } : n <= 5 ? { label: "Low stock", cls: "bg-amber-50 text-amber-700" } : { label: "In stock", cls: "bg-emerald-50 text-emerald-700" });

export default function StaffProductsPage() {
  const [vendorId, setVendorId] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [stock, setStock] = useState<Stock>("ALL");
  const [selected, setSelected] = useState<ProductPerformance | null>(null);
  const stores = useAsync(() => api.getAssignedStores(), "staff-stores");
  const q = useAsync(() => api.getProductsAnalytics({ vendorId: vendorId || undefined, search: search || undefined, limit: 100 }), `${vendorId}|${search}`);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  const list = useMemo(
    () =>
      (q.data?.products || []).filter((p) => {
        const n = Number(p.stock || 0);
        if (stock === "IN_STOCK") return n > 5;
        if (stock === "LOW_STOCK") return n > 0 && n <= 5;
        if (stock === "OUT_OF_STOCK") return n <= 0;
        return true;
      }),
    [q.data, stock]
  );

  return (
    <>
      <PageHeader title="Product Moderation" subtitle={`${q.data?.total ?? 0} products across your assigned stores`} />
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products by title…" aria-label="Search products" />
          </div>
          <select className={`${field} lg:w-72`} value={vendorId} onChange={(e) => setVendorId(e.target.value)} aria-label="Filter by store">
            <option value="">All assigned stores</option>
            {(stores.data || []).map((v) => (
              <option key={v._id} value={v._id}>{v.storeName || v.businessDetails?.businessName || "Store"}</option>
            ))}
          </select>
        </div>
        <Tabs tabs={STOCK} active={stock} onChange={setStock} />
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading products…" />
        ) : !list.length ? (
          <div className="bg-white rounded-2xl border border-slate-100"><EmptyState icon={Package} title="No products found" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {list.map((p) => {
              const st = stockState(Number(p.stock || 0));
              return (
                <button key={p._id} type="button" onClick={() => setSelected(p)} className="text-left bg-white rounded-2xl border border-slate-200/80 p-3.5 flex gap-3.5 hover:border-sky-300 transition-all shadow-sm cursor-pointer">
                  <span className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-slate-900 line-clamp-2">{p.name}</span>
                    <span className="block text-sm font-extrabold text-slate-900 mt-0.5">{npr(p.price)}</span>
                    <span className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      <span className="text-[10px] text-slate-500">{p.stock ?? 0} units</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <Modal open title="Product Inspection" onClose={() => setSelected(null)}>
          <div className="space-y-3">
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt="" className="w-full h-48 object-contain rounded-xl bg-slate-50" />
            )}
            <p className="text-base font-extrabold text-slate-900">{selected.name}</p>
            <dl className="grid grid-cols-2 gap-2">
              {([
                ["Price", npr(selected.price)],
                ["In stock", `${selected.stock ?? 0} units`],
                ["Units sold", `${selected.unitsSold ?? 0} units`],
                ["Returned", `${selected.returnedUnits ?? 0} units`],
                ["Category", selected.category || "General"],
                ["Net sales", npr(selected.netSales ?? 0)],
                ["Status", selected.isActive === false ? "Inactive" : "Active"],
                ["Last sale", selected.lastSaleDate ? formatDate(selected.lastSaleDate) : "—"],
              ] as Array<[string, string]>).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                  <dd className="text-sm font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Modal>
      )}
    </>
  );
}
