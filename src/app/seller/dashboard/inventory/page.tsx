"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Boxes, CheckCircle2, Minus, Package, PackagePlus, Pencil, Plus, RefreshCw, Search, XCircle } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { SellerProduct } from "@/lib/seller/types";
import { isLowStock, isOutOfStock, npr, productImage } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, StatCard, btn, field, fieldLabel } from "@/components/vendor/ui";

const FILTERS = ["all", "in_stock", "low_stock", "out_of_stock"] as const;
type FilterKey = (typeof FILTERS)[number];

export default function InventoryPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading inventory…" />}>
      <InventoryView />
    </Suspense>
  );
}

function InventoryView() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("filter");
  const filter: FilterKey = FILTERS.includes(raw as FilterKey) ? (raw as FilterKey) : "all";
  const setFilter = (f: FilterKey) => router.replace(f === "all" ? "/seller/dashboard/inventory" : `/seller/dashboard/inventory?filter=${f}`);

  const { data, error, loading, reload, setData } = useAsync(() => api.getMyProducts(), "products");
  const products = useMemo(() => data?.products || [], [data]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SellerProduct | null>(null);

  const kpi = useMemo(
    () => ({
      total: products.length,
      in: products.filter((p) => !isOutOfStock(p) && !isLowStock(p)).length,
      low: products.filter(isLowStock).length,
      out: products.filter(isOutOfStock).length,
    }),
    [products]
  );
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "low_stock" && !isLowStock(p)) return false;
      if (filter === "out_of_stock" && !isOutOfStock(p)) return false;
      if (filter === "in_stock" && (isOutOfStock(p) || isLowStock(p))) return false;
      if (category !== "All" && p.category !== category) return false;
      return !q || [p.name, p.sku, p.category].some((f) => (f || "").toLowerCase().includes(q));
    });
  }, [products, filter, category, search]);

  const patchLocal = (id: string, patch: Partial<SellerProduct>) =>
    setData((prev) => (prev ? { ...prev, products: prev.products.map((p) => (p._id === id ? { ...p, ...patch } : p)) } : prev));

  const saveStock = async (p: SellerProduct, stock: number, reorderLevel?: number) => {
    setBusyId(p._id);
    setActionError(null);
    const patch = { stock, inStock: stock > 0, ...(reorderLevel !== undefined ? { reorderLevel } : {}) };
    try {
      await api.updateProduct(p._id, patch);
      patchLocal(p._id, patch);
      return true;
    } catch (e) {
      setActionError(api.errorText(e));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const toggle = async (p: SellerProduct) => {
    setBusyId(p._id);
    setActionError(null);
    try {
      const r = await api.toggleProductStock(p._id);
      patchLocal(p._id, { inStock: r.inStock, status: r.status ?? p.status });
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Stock & Inventory Overview"
        subtitle="Keep stock levels accurate so customers never order unavailable items."
        actions={
          <>
            <button type="button" onClick={reload} className={btn.outline} aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link href="/seller/dashboard/products/add" className={btn.primary}>
              <PackagePlus className="w-4 h-4" /> Add Product
            </Link>
          </>
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(
            [
              ["all", "Total Items", kpi.total, Boxes, "teal"],
              ["in_stock", "In Stock", kpi.in, CheckCircle2, "green"],
              ["low_stock", "Low Stock", kpi.low, AlertTriangle, "amber"],
              ["out_of_stock", "Out of Stock", kpi.out, XCircle, "red"],
            ] as const
          ).map(([key, label, value, Icon, tone]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} className={`text-left rounded-2xl cursor-pointer ${filter === key ? "ring-2 ring-vendor-dark" : ""}`} aria-pressed={filter === key}>
              <StatCard label={label} value={value} icon={Icon} tone={tone} />
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            aria-label="Search inventory"
            className="w-full h-11 bg-white text-sm pl-10 pr-4 rounded-xl border border-slate-200 focus:border-vendor-dark focus:ring-2 focus:ring-vendor-100 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${category === c ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-200 text-slate-600"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {error && <ErrorBanner message={error} onRetry={reload} />}
        {actionError && <ErrorBanner message={actionError} />}

        {loading && !data ? (
          <LoadingBlock text="Loading inventory…" />
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState
              icon={Boxes}
              title="No Stock Items Found"
              action={
                <Link href="/seller/dashboard/products/add" className={btn.primary}>
                  Add New Product
                </Link>
              }
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {visible.map((p) => {
              const out = isOutOfStock(p);
              const low = isLowStock(p);
              const busy = busyId === p._id;
              const img = productImage(p);
              return (
                <div key={p._id} className="p-3 md:p-4 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
                  <span className="w-14 h-14 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </span>
                  <div className="flex-1 min-w-[10rem]">
                    <Link href={`/seller/dashboard/products/${p._id}`} className="text-sm font-bold text-slate-900 hover:text-vendor-dark line-clamp-1">
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      {npr(p.price)} · SKU {p.sku || "—"} · reorder at {p.reorderLevel || 5}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      out ? "bg-red-50 text-red-700 border-red-200" : low ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {out ? "Out of Stock" : low ? "Low Stock" : "In Stock"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" disabled={busy || p.stock <= 0} onClick={() => saveStock(p, Math.max(0, p.stock - 1))} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40" aria-label={`Decrease ${p.name} stock`}>
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-12 text-center text-sm font-extrabold text-slate-900">{p.stock}</span>
                    <button type="button" disabled={busy} onClick={() => saveStock(p, p.stock + 1)} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40" aria-label={`Increase ${p.name} stock`}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button type="button" role="switch" aria-checked={p.inStock !== false} aria-label={`${p.name} active`} disabled={busy} onClick={() => toggle(p)} className="cursor-pointer disabled:opacity-60">
                    <span className={`relative block w-9 h-5 rounded-full transition-colors ${p.inStock !== false ? "bg-vendor-done" : "bg-slate-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.inStock !== false ? "left-4.5" : "left-0.5"}`} />
                    </span>
                  </button>
                  <button type="button" onClick={() => setEditing(p)} className="p-2 rounded-lg text-slate-500 hover:text-vendor-dark hover:bg-vendor-soft cursor-pointer" aria-label={`Adjust ${p.name} stock`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <AdjustStockModal
          key={editing._id}
          product={editing}
          busy={busyId === editing._id}
          onClose={() => setEditing(null)}
          onSave={async (stock, reorder) => {
            if (await saveStock(editing, stock, reorder)) setEditing(null);
          }}
        />
      )}
    </>
  );
}

function AdjustStockModal({
  product,
  busy,
  onClose,
  onSave,
}: {
  product: SellerProduct;
  busy: boolean;
  onClose: () => void;
  onSave: (stock: number, reorder: number) => void;
}) {
  const [stock, setStock] = useState(String(product.stock));
  const [reorder, setReorder] = useState(String(product.reorderLevel || 5));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const s = parseInt(stock, 10);
    const r = parseInt(reorder, 10);
    if (isNaN(s) || s < 0) return setError("Enter a valid stock quantity.");
    onSave(s, isNaN(r) ? 5 : r);
  };

  return (
    <Modal
      open
      title="Adjust Stock Level"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={save} className={btn.primary}>
            {busy ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm font-bold text-slate-900">{product.name}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={fieldLabel}>Stock quantity</span>
            <input className={field} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Low-stock alert at</span>
            <input className={field} inputMode="numeric" value={reorder} onChange={(e) => setReorder(e.target.value.replace(/\D/g, ""))} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">Setting stock to 0 marks the product unavailable.</p>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
