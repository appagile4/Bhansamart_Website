"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Search } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { ProductPerformance } from "@/lib/admin/types";
import { formatDate, npr } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, Tabs, btn, field } from "@/components/admin/ui";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 30>(20);
  const stores = useAsync(() => api.getAssignedStores(), "staff-stores");
  const q = useAsync(() => api.getProductsAnalytics({ vendorId: vendorId || undefined, search: search || undefined, limit: 100 }), `${vendorId}|${search}`);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 400);
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

  const totalFiltered = list.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, safePage, pageSize]);

  return (
    <>
      <PageHeader title="Product Moderation" subtitle={`${q.data?.total ?? 0} products across your assigned stores`} />
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products by title…" aria-label="Search products" />
          </div>
          <select
            className={`${field} lg:w-72`}
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by store"
          >
            <option value="">All assigned stores</option>
            {(stores.data || []).map((v) => (
              <option key={v._id} value={v._id}>{v.storeName || v.businessDetails?.businessName || "Store"}</option>
            ))}
          </select>
          <select
            className={`${field} w-auto`}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 20 | 30);
              setPage(1);
            }}
            aria-label="Items per page"
          >
            <option value={20}>20 per page</option>
            <option value={30}>30 per page</option>
          </select>
        </div>
        <Tabs
          tabs={STOCK}
          active={stock}
          onChange={(s) => {
            setStock(s);
            setPage(1);
          }}
        />
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading products…" />
        ) : !list.length ? (
          <div className="bg-white rounded-2xl border border-slate-100"><EmptyState icon={Package} title="No products found" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {paginatedList.map((p) => {
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

            {/* Pagination Controls */}
            {totalFiltered > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
                  Showing <span className="font-bold text-slate-800">{(safePage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(safePage * pageSize, totalFiltered)}</span> of{" "}
                  <span className="font-bold text-slate-800">{totalFiltered}</span> products
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5" role="navigation" aria-label="Pagination">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`${btn.outline} h-9 px-3 gap-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <React.Fragment key={p}>
                              {showEllipsis && <span className="px-1 text-xs text-slate-400">…</span>}
                              <button
                                type="button"
                                onClick={() => {
                                  setPage(p);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                aria-current={safePage === p ? "page" : undefined}
                                className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                                  safePage === p
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`${btn.outline} h-9 px-3 gap-1 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                      aria-label="Next Page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
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
