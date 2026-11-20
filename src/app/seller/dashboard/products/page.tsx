"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Filter, LayoutGrid, List, Package, PackagePlus,  RefreshCw, Search, X } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { SellerProduct } from "@/lib/seller/types";
import { isLowStock, isOutOfStock, npr, productImage } from "@/lib/seller/format";
import { MAIN_CATEGORY_NAMES } from "@/lib/constants/categories";
import { EmptyState, ErrorBanner, LoadingBlock, PageHeader, btn, field, fieldLabel } from "@/components/vendor/ui";

// app: SORT_OPTIONS + quick price chips
const SORT_OPTIONS = [
  { id: "default", label: "Default" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "alpha", label: "Alphabetic Order" },
] as const;
type SortId = (typeof SORT_OPTIONS)[number]["id"];
const PRICE_CHIPS = [
  { label: "Under 500", min: "", max: "500" },
  { label: "500 – 1500", min: "500", max: "1500" },
  { label: "Above 1500", min: "1500", max: "" },
];
type StockFilter = "all" | "in_stock" | "out_of_stock";

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading products…" />}>
      <ProductsView />
    </Suspense>
  );
}

function ProductsView() {
  const params = useSearchParams();
  const { data, error, loading, reload, setData } = useAsync(() => api.getMyProducts(), "products");
  const products = useMemo(() => data?.products || [], [data]);

  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [sort, setSort] = useState<SortId>("default");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [stock, setStock] = useState<StockFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>(MAIN_CATEGORY_NAMES);
    products.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [products]);

  const activeFilters = (stock !== "all" ? 1 : 0) + (minPrice || maxPrice ? 1 : 0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    const list = products.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (stock === "in_stock" && isOutOfStock(p)) return false;
      if (stock === "out_of_stock" && !isOutOfStock(p)) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      if (!q) return true;
      return [p.name, p.category, p.subCategory, p.sku, p.brand].some((f) => (f || "").toLowerCase().includes(q));
    });
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sort === "alpha") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, category, stock, minPrice, maxPrice, search, sort]);

  const toggleAvailable = async (p: SellerProduct) => {
    setToggling(p._id);
    setActionError(null);
    try {
      const r = await api.toggleProductStock(p._id);
      setData((prev) =>
        prev
          ? { ...prev, products: prev.products.map((x) => (x._id === p._id ? { ...x, inStock: r.inStock ?? !x.inStock, status: r.status ?? x.status } : x)) }
          : prev
      );
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setToggling(null);
    }
  };

  const resetFilters = () => {
    setStock("all");
    setMinPrice("");
    setMaxPrice("");
    setCategory("All");
    setSearch("");
  };

  return (
    <>
      <PageHeader
        title="Product Management"
        subtitle={`${data?.total ?? products.length} products in your catalogue`}
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
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, category, or SKU..."
            aria-label="Search products"
            className="w-full h-11 bg-white text-sm pl-10 pr-4 rounded-xl border border-slate-200 focus:border-vendor-dark focus:ring-2 focus:ring-vendor-100 focus:outline-none"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${
                category === c ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-200 text-slate-600 hover:border-vendor-dark"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className={`${field} h-9 w-auto pr-8`}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFilterOpen((o) => !o)} className={`${btn.outline} h-9 relative`} aria-expanded={filterOpen}>
              <Filter className="w-4 h-4" /> Filter
              {activeFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{activeFilters}</span>
              )}
            </button>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden" role="group" aria-label="View mode">
              {(["grid", "list"] as const).map((m) => {
                const Icon = m === "grid" ? LayoutGrid : List;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setView(m)}
                    aria-pressed={view === m}
                    aria-label={`${m} view`}
                    className={`w-9 h-9 flex items-center justify-center cursor-pointer ${view === m ? "bg-vendor-dark text-white" : "bg-white text-slate-500"}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter panel — app: FILTER MODAL */}
        {filterOpen && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className={fieldLabel}>Availability</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "All Items"],
                    ["in_stock", "In Stock Only"],
                    ["out_of_stock", "Out of Stock"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setStock(k)}
                    aria-pressed={stock === k}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${stock === k ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-200 text-slate-600"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={fieldLabel}>Price Range (NPR)</span>
              <div className="flex items-center gap-2">
                <input className={field} inputMode="numeric" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value.replace(/[^\d.]/g, ""))} aria-label="Minimum price" />
                <span className="text-slate-400">–</span>
                <input className={field} inputMode="numeric" placeholder="5000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d.]/g, ""))} aria-label="Maximum price" />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRICE_CHIPS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(c.min);
                      setMaxPrice(c.max);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-slate-200 text-slate-600 hover:border-vendor-dark cursor-pointer"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end justify-end">
              <button type="button" onClick={resetFilters} className={btn.ghost}>
                <X className="w-4 h-4" /> Reset All Filters
              </button>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} onRetry={reload} />}
        {actionError && <ErrorBanner message={actionError} />}

        {loading && !data ? (
          <LoadingBlock text="Loading products…" />
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState
              icon={Package}
              title="No Products Found"
              text={products.length ? "Try a different search or filter." : "Add your first product to start selling."}
              action={
                products.length ? (
                  <button type="button" onClick={resetFilters} className={btn.outline}>
                    Reset All Filters
                  </button>
                ) : (
                  <Link href="/seller/dashboard/products/add" className={btn.primary}>
                    <PackagePlus className="w-4 h-4" /> Add Product
                  </Link>
                )
              }
            />
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {visible.map((p) => (
              <ProductTile key={p._id} p={p} toggling={toggling === p._id} onToggle={() => toggleAvailable(p)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {visible.map((p) => (
              <ProductRow key={p._id} p={p} toggling={toggling === p._id} onToggle={() => toggleAvailable(p)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StockLabel({ p }: { p: SellerProduct }) {
  if (isOutOfStock(p)) return <span className="text-[10px] font-bold text-red-600">Out of stock</span>;
  if (isLowStock(p)) return <span className="text-[10px] font-bold text-amber-600">Low · {p.stock} left</span>;
  return <span className="text-[10px] font-semibold text-slate-500">{p.stock} in stock</span>;
}

function AvailableSwitch({ p, toggling, onToggle }: { p: SellerProduct; toggling: boolean; onToggle: () => void }) {
  const on = p.inStock !== false;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={toggling}
      role="switch"
      aria-checked={on}
      aria-label={`${p.name} available`}
      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer disabled:opacity-60"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-vendor-done" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-4.5" : "left-0.5"}`} />
      </span>
      Available
    </button>
  );
}

function Thumb({ p, className }: { p: SellerProduct; className: string }) {
  const src = productImage(p);
  return (
    <span className={`bg-slate-50 overflow-hidden flex items-center justify-center ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <Package className="w-8 h-8 text-slate-300" />
      )}
    </span>
  );
}

function ProductTile({ p, toggling, onToggle }: { p: SellerProduct; toggling: boolean; onToggle: () => void }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <Link href={`/seller/dashboard/products/${p._id}`} className="block">
        <Thumb p={p} className="w-full aspect-square" />
      </Link>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <Link href={`/seller/dashboard/products/${p._id}`} className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-vendor-dark">
          {p.name}
        </Link>
        <p className="text-[11px] text-slate-500 truncate">
          {p.category}
          {p.unit ? ` · ${p.unit}` : ""}
        </p>
        <p className="text-sm">
          <span className="font-extrabold text-slate-900">{npr(p.price)}</span>
          {!!p.originalPrice && p.originalPrice > p.price && <span className="ml-1.5 text-xs text-slate-400 line-through">{npr(p.originalPrice)}</span>}
        </p>
        <StockLabel p={p} />
        <div className="mt-auto pt-2 flex items-center justify-between">
          <AvailableSwitch p={p} toggling={toggling} onToggle={onToggle} />
        </div>
      </div>
    </article>
  );
}

function ProductRow({ p, toggling, onToggle }: { p: SellerProduct; toggling: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-4 p-3 md:p-4">
      <Link href={`/seller/dashboard/products/${p._id}`}>
        <Thumb p={p} className="w-16 h-16 rounded-xl shrink-0" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/seller/dashboard/products/${p._id}`} className="text-sm font-bold text-slate-900 hover:text-vendor-dark line-clamp-1">
          {p.name}
        </Link>
        <p className="text-[11px] text-slate-500 truncate">
          {p.category} {p.sku ? `· SKU ${p.sku}` : ""}
        </p>
        <StockLabel p={p} />
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-sm font-extrabold text-slate-900">{npr(p.price)}</p>
        {!!p.originalPrice && p.originalPrice > p.price && <p className="text-xs text-slate-400 line-through">{npr(p.originalPrice)}</p>}
      </div>
      <AvailableSwitch p={p} toggling={toggling} onToggle={onToggle} />
    </div>
  );
}
