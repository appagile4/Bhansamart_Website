"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudUpload,
  CornerDownRight,
  Folder,
  ImagePlus,
  Inbox,
  Layers,
  Loader2,
  Package,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  Shapes,
  ShoppingBag,
  Store,
  X,
  XCircle,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminCategory, AdminProduct } from "@/lib/admin/types";
import { ErrorBanner, LoadingBlock, Modal, SuccessBanner, btn, field } from "@/components/admin/ui";

/*
 * Mirrors the app's AdminMain/catalog.tsx ("Catalog & Products"): Categories / Product segmented tabs,
 * collapsible category cards with subcategory grids, moderation product cards — same wording and the
 * app's emerald (#10B981) accent, laid out for the web.
 */
const parentId = (c: AdminCategory) => (c.parentCategory && typeof c.parentCategory === "object" ? c.parentCategory._id : (c.parentCategory as string | null | undefined) || null);
const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;

export default function CatalogPage() {
  const [tab, setTab] = useState<"categories" | "products">("categories");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cats = useAsync(() => api.getCategories(), "categories");
  const [productsTotal, setProductsTotal] = useState<number | null>(null);
  const rootCount = useMemo(() => (cats.data?.all || []).filter((c) => c.level === 0 || !parentId(c)).length, [cats.data]);

  const switchTab = (t: "categories" | "products") => {
    setTab(t);
    setNotice(null);
    setError(null);
  };

  return (
    <div className="text-[#0F172A]">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-extrabold">Catalog & Products</h1>
        <p className="text-sm text-[#64748B]">Categories & Moderation</p>
      </div>

      {/* Segmented tabs */}
      <div className="flex p-1 rounded-xl bg-[#E2E8F0] max-w-md mb-4" role="tablist">
        {([
          { key: "categories", label: "Categories", icon: Shapes, count: rootCount },
          { key: "products", label: "Product", icon: Box, count: productsTotal ?? 0 },
        ] as const).map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => switchTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[9px] text-sm cursor-pointer transition-colors ${on ? "bg-white shadow-sm font-extrabold text-[#0F172A]" : "font-semibold text-[#64748B]"}`}
            >
              <t.icon className="w-4 h-4" style={{ color: on ? "#10B981" : "#64748B" }} />
              {t.label}
              {t.count > 0 && (
                <span className={`min-w-5 px-1.5 rounded-[10px] text-[11px] font-extrabold ${on ? "bg-[#10B981] text-white" : "bg-[#CBD5E1] text-[#475569]"}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} />}
        {tab === "categories" ? (
          <CategoriesTab q={cats} onNotice={setNotice} onError={setError} />
        ) : (
          <ProductsTab onNotice={setNotice} onError={setError} onTotal={setProductsTotal} />
        )}
      </div>
    </div>
  );
}

/* ─── Categories ─────────────────────────────────────────────────────── */

type CatsQuery = ReturnType<typeof useAsync<{ all: AdminCategory[]; root: AdminCategory[]; subs: AdminCategory[] }>>;

function CategoriesTab({ q, onNotice, onError }: { q: CatsQuery; onNotice: (m: string) => void; onError: (m: string | null) => void }) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<AdminCategory | { level: 0 | 1; parent?: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCategory, setConfirmCategory] = useState<{
    category: AdminCategory;
    targetActive: boolean;
  } | null>(null);

  const all = useMemo(() => q.data?.all || [], [q.data]);
  const roots = useMemo(() => all.filter((c) => c.level === 0 || !parentId(c)), [all]);
  const childrenOf = (id: string) => all.filter((c) => parentId(c) === id);
  const s = search.trim().toLowerCase();
  const visibleRoots = roots.filter((r) => !s || r.name.toLowerCase().includes(s) || childrenOf(r._id).some((c) => c.name.toLowerCase().includes(s)));
  const subCount = all.length - roots.length;
  const allExpanded = roots.every((r) => !collapsed[r._id]);

  const toggleAll = () => setCollapsed(allExpanded ? Object.fromEntries(roots.map((r) => [r._id, true])) : {});

  const toggleActive = async (c: AdminCategory, targetActive: boolean) => {
    setBusyId(c._id);
    onError(null);
    try {
      await api.updateCategory(c._id, { isActive: targetActive });
      onNotice(`"${c.name}" is now ${targetActive ? "active" : "deactivated"}.`);
      setConfirmCategory(null);
      q.reload();
    } catch (e) {
      onError(api.errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Search & add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[10px] px-3 h-11">
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <input className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#94A3B8]" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories or subcategories..." aria-label="Search categories" />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="cursor-pointer" aria-label="Clear search">
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => setEditing({ level: 0 })} className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold cursor-pointer">
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-[#0F172A]">
          <Shapes className="w-3.5 h-3.5 text-[#10B981]" /> {roots.length} Root Categories
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-[#0F172A]">
          <Layers className="w-3.5 h-3.5 text-[#0284C7]" /> {subCount} Subcategories
        </span>
        {q.loading && q.data && (
          <span className="inline-flex items-center gap-1 text-xs text-[#64748B] font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10B981]" /> Updating…
          </span>
        )}
        <button type="button" onClick={toggleAll} className="ml-auto text-xs font-extrabold text-[#10B981] hover:underline cursor-pointer">
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

      {q.loading && !q.data ? (
        <LoadingBlock text="Loading categories…" />
      ) : visibleRoots.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center">
          <Shapes className="w-10 h-10 text-[#64748B]" />
          <p className="mt-2 text-sm text-[#64748B]">{s ? "No categories match your search." : "No categories yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 items-start">
          {visibleRoots.map((r) => {
            const kids = childrenOf(r._id).filter((c) => !s || c.name.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
            const isCollapsed = Boolean(collapsed[r._id]);
            const active = r.isActive !== false;
            return (
              <article key={r._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${active ? "border-[#E2E8F0]" : "border-[#FEE2E2]"}`}>
                {/* Header (click to collapse / expand) */}
                <button
                  type="button"
                  onClick={() => setCollapsed((m) => ({ ...m, [r._id]: !isCollapsed }))}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                >
                  <span className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${active ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"}`}>
                    {r.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Shapes className="w-5 h-5" style={{ color: active ? "#10B981" : "#EF4444" }} />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] font-extrabold truncate ${active ? "" : "line-through text-[#64748B]"}`}>{r.name}</span>
                    <span className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] font-semibold text-[#64748B]">/{r.slug}</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] font-semibold text-[#64748B]">
                        <Layers className="w-3 h-3" /> {childrenOf(r._id).length} Subs
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${active ? "bg-[#ECFDF5] border-[#10B981] text-[#10B981]" : "bg-[#FEF2F2] border-[#EF4444] text-[#EF4444]"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
                      {active ? "Active" : "Inactive"}
                    </span>
                    <span className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                      {isCollapsed ? <ChevronDown className="w-4 h-4 text-[#64748B]" /> : <ChevronUp className="w-4 h-4 text-[#64748B]" />}
                    </span>
                  </span>
                </button>

                {/* Action toolbar */}
                <div className="flex flex-wrap gap-2 px-4 py-2.5 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    disabled={busyId === r._id}
                    onClick={() => setConfirmCategory({ category: r, targetActive: !active })}
                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-60 transition-colors ${
                      active
                        ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEE2E2]"
                        : "bg-[#ECFDF5] border-[#6EE7B7] text-[#10B981] hover:bg-[#D1FAE5]"
                    }`}
                  >
                    {busyId === r._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : active ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    {busyId === r._id
                      ? active
                        ? "Deactivating…"
                        : "Activating…"
                      : active
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                  <button type="button" onClick={() => setEditing(r)} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-bold text-[#0F172A] cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => setEditing({ level: 1, parent: r._id })} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#10B981] border border-[#10B981] text-xs font-bold text-white cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add Subcategory
                  </button>
                </div>

                {/* Subcategories */}
                {!isCollapsed && (
                  <div className="px-4 py-3 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                        <CornerDownRight className="w-3.5 h-3.5 text-[#10B981]" /> Customer Subcategories
                        <span className="px-1.5 rounded bg-[#E2E8F0] text-[10px] text-[#475569]">{kids.length}</span>
                      </p>
                      <button type="button" onClick={() => setEditing({ level: 1, parent: r._id })} className="inline-flex items-center gap-0.5 text-xs font-bold text-[#10B981] cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> New
                      </button>
                    </div>
                    {kids.length === 0 ? (
                      <div className="flex flex-col items-center py-4 rounded-xl bg-[#F8FAFC]">
                        <Inbox className="w-5 h-5 text-[#64748B]" />
                        <p className="text-xs text-[#64748B] mt-1">No subcategories under {r.name}.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {kids.map((c) => {
                          const subActive = c.isActive !== false;
                          return (
                            <div key={c._id} className={`flex items-center gap-2.5 rounded-xl border bg-[#F8FAFC] p-2 ${subActive ? "border-[#E2E8F0]" : "border-[#FEE2E2]"}`}>
                              <span className="w-9 h-9 rounded-lg overflow-hidden bg-[#E2E8F0] flex items-center justify-center shrink-0">
                                {c.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Folder className="w-4 h-4 text-[#94A3B8]" />
                                )}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className={`block text-xs font-bold truncate ${subActive ? "" : "line-through text-[#64748B]"}`}>{c.name}</span>
                                <span className="block text-[10px] text-[#64748B] truncate">/{c.slug}</span>
                              </span>
                              <button
                                type="button"
                                disabled={busyId === c._id}
                                onClick={() => setConfirmCategory({ category: c, targetActive: !subActive })}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer disabled:opacity-60 transition-colors ${
                                  subActive
                                    ? "bg-[#ECFDF5] border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5]"
                                    : "bg-[#FEF2F2] border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]"
                                }`}
                                title={subActive ? "Deactivate" : "Activate"}
                              >
                                {busyId === c._id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : null}
                                {busyId === c._id
                                  ? subActive
                                    ? "Deactivating…"
                                    : "Activating…"
                                  : subActive
                                  ? "Active"
                                  : "Inactive"}
                              </button>
                              <button type="button" onClick={() => setEditing(c)} className="w-7 h-7 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center cursor-pointer" aria-label={`Edit ${c.name}`}>
                                <Pencil className="w-3 h-3 text-[#0F172A]" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal before activating or deactivating a category */}
      {confirmCategory && (() => {
        const c = confirmCategory.category;
        const isRoot = c.level === 0 || !parentId(c);
        const targetActive = confirmCategory.targetActive;
        const isBusy = busyId === c._id;
        return (
          <Modal
            open
            title={
              targetActive
                ? isRoot
                  ? "Activate Root Category"
                  : "Activate Subcategory"
                : isRoot
                ? "Deactivate Root Category"
                : "Deactivate Subcategory"
            }
            onClose={() => (isBusy ? undefined : setConfirmCategory(null))}
            footer={
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setConfirmCategory(null)}
                  className={btn.ghost}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => toggleActive(c, targetActive)}
                  className={targetActive ? btn.success : btn.dangerSolid}
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {targetActive ? "Activating…" : "Deactivating…"}
                    </>
                  ) : targetActive ? (
                    isRoot ? "Activate Category" : "Activate Subcategory"
                  ) : isRoot ? (
                    "Deactivate Category"
                  ) : (
                    "Deactivate Subcategory"
                  )}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shapes className="w-5 h-5 text-slate-500" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{c.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-mono">/{c.slug}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-200/70 text-[10px] font-bold text-slate-600">
                      {isRoot ? "Root Category" : "Subcategory"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  targetActive
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {targetActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">
                      {targetActive
                        ? `Activate "${c.name}"?`
                        : `Deactivate "${c.name}"?`}
                    </p>
                    <p className="text-[11px] opacity-90">
                      {targetActive
                        ? isRoot
                          ? "This root category and its active subcategories will immediately become visible to customers across the storefront and navigation."
                          : "This subcategory will immediately become visible under its parent category in the customer store."
                        : isRoot
                        ? "Deactivating this root category will immediately hide it, all of its child subcategories, and associated products from customer browsing and searching in the customer app."
                        : "Deactivating this subcategory will hide it from customer browse views and category navigation."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      {editing && (
        <CategoryEditor
          initial={editing}
          roots={roots}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setEditing(null);
            onNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

const Compulsory = () => <span className="text-[#EF4444] font-semibold"> * (Compulsory)</span>;

function CategoryEditor({
  initial,
  roots,
  onClose,
  onSaved,
}: {
  initial: AdminCategory | { level: 0 | 1; parent?: string };
  roots: AdminCategory[];
  onClose: () => void;
  onSaved: (m: string) => void;
}) {
  const existing = "_id" in initial ? initial : null;
  const [name, setName] = useState(existing?.name || "");
  const [slug, setSlug] = useState(existing?.slug || "");
  const [desc, setDesc] = useState(existing?.description || "");
  const [image, setImage] = useState(existing?.image || "");
  const [level, setLevel] = useState<number>(existing ? (parentId(existing) ? 1 : existing.level || 0) : initial.level);
  const [parent, setParent] = useState<string>(existing ? parentId(existing) || "" : ("parent" in initial && initial.parent) || "");
  const [active, setActive] = useState(existing ? existing.isActive !== false : true);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      setImage(await api.uploadCategoryImage(file));
    } catch (e) {
      setError(api.errorText(e, "Image upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    // Same required fields as the app
    if (!name.trim()) return setError("Category Name is required.");
    if (!slug.trim()) return setError("Category Slug is required.");
    if (!image.trim()) return setError("Category Image is required.");
    if (!desc.trim()) return setError("Category Description is required.");
    if (level === 1 && !parent) return setError("Parent Category is required for a subcategory.");
    const payload: api.CategoryInput = {
      name: name.trim(),
      description: desc.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      image: image.trim(),
      level,
      parentCategory: level === 1 ? parent : null,
      isActive: active,
    };
    setBusy(true);
    setError(null);
    try {
      if (existing) await api.updateCategory(existing._id, payload);
      else await api.createCategory(payload);
      onSaved(existing ? "Category updated successfully!" : "Category created successfully!");
    } catch (e) {
      setError(api.errorText(e, "Failed to save category"));
    } finally {
      setBusy(false);
    }
  };

  const label = "block text-xs font-bold text-[#334155] mb-1.5";
  return (
    <Modal
      open
      wide
      title={existing ? "Edit Category" : level === 1 ? "Add Subcategory" : "Add Category"}
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy || uploading} onClick={save} className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-sm font-bold cursor-pointer disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {busy ? "Saving…" : existing ? "Save Changes" : level === 1 ? "Create Subcategory" : "Create Category"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 text-xs font-medium text-[#B91C1C]" role="alert">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <div className="flex p-1 rounded-lg bg-[#F1F5F9]" role="group" aria-label="Category level">
          {[0, 1].map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l} className={`flex-1 py-1.5 rounded-md text-xs font-bold cursor-pointer ${level === l ? "bg-[#10B981] text-white" : "text-[#64748B]"}`}>
              {l === 0 ? "Root Category" : "Subcategory"}
            </button>
          ))}
        </div>

        {level === 1 && (
          <div>
            <p className={label}>
              Parent Category
              <Compulsory />
            </p>
            <div className="flex flex-wrap gap-2">
              {roots
                .filter((r) => r._id !== existing?._id)
                .map((r) => {
                  const sel = parent === r._id;
                  return (
                    <button key={r._id} type="button" onClick={() => setParent(r._id)} aria-pressed={sel} className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer ${sel ? "bg-[#10B981] border-[#10B981] text-white" : "bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A]"}`}>
                      {r.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>
              Category Name
              <Compulsory />
            </span>
            <input
              className={field}
              value={name}
              placeholder="e.g. Dairy & Bakery"
              onChange={(e) => {
                setName(e.target.value);
                if (!existing) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
              }}
            />
          </label>
          <label className="block">
            <span className={label}>
              Slug
              <Compulsory />
            </span>
            <input className={field} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. dairy-bakery" />
          </label>
        </div>

        <div>
          <p className={label}>
            Category Image
            <Compulsory />
          </p>
          <div className="flex gap-2">
            <input className={`${field} flex-1`} value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste image URL or pick from gallery..." aria-label="Image URL" />
            {image && (
              <button type="button" onClick={() => setImage("")} className="px-2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer" aria-label="Clear image">
                <XCircle className="w-4 h-4" />
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold cursor-pointer shrink-0">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />} Gallery
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>
          <div className="mt-2">
            {uploading ? (
              <div className="h-28 rounded-xl border border-dashed border-[#10B981] bg-[#ECFDF5] flex flex-col items-center justify-center gap-1.5">
                <Loader2 className="w-6 h-6 animate-spin text-[#10B981]" />
                <span className="text-xs font-bold text-[#10B981]">Uploading to Cloudinary...</span>
              </div>
            ) : image ? (
              <div>
                <p className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] mb-1">
                  Image Live Preview:
                  {/cloudinary/i.test(image) && (
                    <span className="inline-flex items-center gap-1 text-[#10B981]">
                      <CloudUpload className="w-3.5 h-3.5" /> Cloudinary Hosted
                    </span>
                  )}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Category preview" className="h-28 w-full object-contain rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]" />
              </div>
            ) : (
              <label className="h-28 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F1F5F9] flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                <ImagePlus className="w-6 h-6 text-[#94A3B8]" />
                <span className="text-xs text-[#94A3B8]">Click to pick from gallery or enter URL above</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>

        <label className="block">
          <span className={label}>
            Description
            <Compulsory />
          </span>
          <textarea className={`${field} h-20 py-2`} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe this category..." />
        </label>

        <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5">
          <span>
            <span className="block text-sm font-bold text-[#0F172A]">Category Status</span>
            <span className="block text-xs font-semibold" style={{ color: active ? "#10B981" : "#EF4444" }}>
              {active ? "Active — visible in the customer app" : "Inactive — hidden from customers"}
            </span>
          </span>
          <button type="button" role="switch" aria-checked={active} onClick={() => setActive((v) => !v)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${active ? "bg-[#10B981]" : "bg-[#767577]"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${active ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Products (moderation) ──────────────────────────────────────────── */

function ProductsTab({ onNotice, onError, onTotal }: { onNotice: (m: string) => void; onError: (m: string | null) => void; onTotal: (n: number) => void }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<20 | 30>(20);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmProduct, setConfirmProduct] = useState<{
    product: AdminProduct;
    targetActive: boolean;
  } | null>(null);
  const q = useAsync(async () => {
    const r = await api.getProducts({ search: search || undefined, page, limit });
    onTotal(r.total);
    return r;
  }, `${search}|${page}|${limit}`);

  const toggle = async (p: AdminProduct, targetActive: boolean) => {
    setBusyId(p._id);
    onError(null);
    try {
      await api.moderateProduct(p._id, { isActive: targetActive });
      onNotice(`"${p.name}" is now ${targetActive ? "an active listing" : "suspended / hidden"}.`);
      setConfirmProduct(null);
      q.reload();
    } catch (e) {
      onError(api.errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const products = q.data?.data || [];
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          className="flex-1 flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[10px] px-3 h-11"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(input.trim());
          }}
        >
          {q.loading && q.data ? (
            <Loader2 className="w-4 h-4 text-[#10B981] animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          )}
          <input className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[#94A3B8]" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products by title or sku..." aria-label="Search products" />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setSearch("");
                setPage(1);
              }}
              className="cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-[#94A3B8]" />
            </button>
          )}
        </form>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value) as 20 | 30);
            setPage(1);
          }}
          className={`${field} h-11 w-auto pr-8 bg-white shrink-0`}
          aria-label="Items per page"
        >
          <option value={20}>20 per page</option>
          <option value={30}>30 per page</option>
        </select>
      </div>

      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      {q.loading && !q.data ? (
        <LoadingBlock text="Loading products…" />
      ) : products.length === 0 ? (
        <div className="py-12 flex flex-col items-center">
          <Package className="w-10 h-10 text-[#64748B]" />
          <p className="mt-2 text-sm text-[#64748B]">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {products.map((p) => {
            const active = p.isActive !== false && p.status !== "Not Active";
            const img = p.images?.[0]?.url;
            const vendor = p.vendor?.businessDetails?.businessName || p.vendor?.storeName || "Direct Store";
            const mrp = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : null;
            return (
              <article key={p._id} className={`bg-white rounded-[14px] border shadow-sm flex flex-col ${active ? "border-[#E2E8F0]" : "border-[#FEE2E2]"}`}>
                <Link href={`/admin/dashboard/catalog/${p._id}`} className="flex gap-3 p-3 hover:bg-[#F8FAFC] rounded-t-[14px]">
                  <span className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#F1F5F9] flex items-center justify-center shrink-0">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Box className="w-6 h-6 text-[#10B981]" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-[#0F172A] line-clamp-2">{p.name}</span>
                      <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
                    </span>
                    <span className="flex items-center gap-1 mt-0.5 text-[11px] text-[#64748B] truncate">
                      <Store className="w-3 h-3 text-[#0284C7] shrink-0" /> {vendor}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-[#10B981]">{nprNum(p.price)}</span>
                      {mrp && <span className="text-[11px] text-[#64748B] line-through">{nprNum(mrp)}</span>}
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[10px] font-extrabold text-[#10B981]">
                        <ShoppingBag className="w-3 h-3" /> {p.ordersCount ?? 0} Sold
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] font-semibold text-[#475569] truncate max-w-[60%]">{p.category || "General"}</span>
                      <span className="text-[11px] font-bold" style={{ color: p.stock > 0 ? "#10B981" : "#EF4444" }}>
                        {p.stock > 0 ? `${p.stock} in stock` : "Out of Stock"}
                      </span>
                    </span>
                  </span>
                </Link>
                <div className="mt-auto flex items-center justify-between gap-2 px-3 py-2 border-t border-[#F1F5F9]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color: active ? "#10B981" : "#EF4444" }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? "#10B981" : "#EF4444" }} />
                    {active ? "Active Listing" : "Suspended / Hidden"}
                  </span>
                  <button
                    type="button"
                    disabled={busyId === p._id}
                    onClick={() => setConfirmProduct({ product: p, targetActive: !active })}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[11px] font-bold cursor-pointer disabled:opacity-60 transition-colors ${
                      active
                        ? "bg-[#FEF2F2] border-[#EF4444] text-[#EF4444] hover:bg-[#FEE2E2]"
                        : "bg-[#ECFDF5] border-[#10B981] text-[#10B981] hover:bg-[#D1FAE5]"
                    }`}
                  >
                    {busyId === p._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : active ? (
                      <Ban className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    {busyId === p._id
                      ? active
                        ? "Suspending…"
                        : "Approving…"
                      : active
                      ? "Suspend"
                      : "Approve Listing"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {(q.data?.totalPages || 1) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1 || q.loading} onClick={() => setPage((x) => x - 1)} className={btn.outline} aria-label="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[#475569]">
            Page {page} of {q.data?.totalPages}
          </span>
          <button type="button" disabled={page >= (q.data?.totalPages || 1) || q.loading} onClick={() => setPage((x) => x + 1)} className={btn.outline} aria-label="Next page">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal before approving or suspending a product */}
      {confirmProduct && (() => {
        const p = confirmProduct.product;
        const targetActive = confirmProduct.targetActive;
        const isBusy = busyId === p._id;
        const img = p.images?.[0]?.url;
        const vendor = p.vendor?.businessDetails?.businessName || p.vendor?.storeName || "Direct Store";
        return (
          <Modal
            open
            title={targetActive ? "Approve Product Listing" : "Suspend Product Listing"}
            onClose={() => (isBusy ? undefined : setConfirmProduct(null))}
            footer={
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setConfirmProduct(null)}
                  className={btn.ghost}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => toggle(p, targetActive)}
                  className={targetActive ? btn.success : btn.dangerSolid}
                >
                  {isBusy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {targetActive ? "Approving…" : "Suspending…"}
                    </>
                  ) : targetActive ? (
                    "Approve Listing"
                  ) : (
                    "Suspend Listing"
                  )}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center shrink-0">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Box className="w-6 h-6 text-slate-500" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                    <Store className="w-3 h-3 text-[#0284C7] shrink-0" /> {vendor}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-black text-[#10B981]">{nprNum(p.price)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-semibold truncate">
                      {p.category || "General"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  targetActive
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-red-50/80 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {targetActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">
                      {targetActive
                        ? `Approve listing for "${p.name}"?`
                        : `Suspend listing for "${p.name}"?`}
                    </p>
                    <p className="text-[11px] opacity-90">
                      {targetActive
                        ? "This product listing will be marked as active and made immediately available for customers to view and purchase across the Bhansamart store."
                        : "This product listing will be immediately suspended and hidden from the customer store. Customers will not be able to find or purchase this item."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
