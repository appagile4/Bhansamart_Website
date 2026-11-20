"use client";

import React, { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import { Package, Save, Star, Store } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminProduct } from "@/lib/admin/types";
import { formatDate, npr } from "@/lib/seller/format";
import { Card, ErrorBanner, LoadingBlock, PageHeader, SuccessBanner, btn, field, fieldLabel } from "@/components/admin/ui";

/** app: Screens/adminScreens/adminproductdetails.tsx */
export default function AdminProductDetailsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading product…" />}>
      <ProductView />
    </Suspense>
  );
}

function ProductView() {
  const { id } = useParams<{ id: string }>();
  const q = useAsync(() => api.getProduct(id), id);
  if (q.loading && !q.data) return <LoadingBlock text="Loading product…" />;
  if (!q.data) return <ErrorBanner message={q.error || "Product not found."} onRetry={q.reload} />;
  return <ProductDetails key={q.data.updatedAt || q.data._id} p={q.data} onSaved={q.reload} />;
}

function ProductDetails({ p, onSaved }: { p: AdminProduct; onSaved: () => void }) {
  const [img, setImg] = useState(0);
  const [name, setName] = useState(p.name);
  const [price, setPrice] = useState(String(p.price ?? ""));
  const [stock, setStock] = useState(String(p.stock ?? ""));
  const [category, setCategory] = useState(p.category || "");
  const [subCategory, setSubCategory] = useState(p.subCategory || "");
  const [active, setActive] = useState(p.isActive);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const pr = parseFloat(price);
    const st = parseInt(stock, 10);
    if (!name.trim()) return setError("Name is required.");
    if (isNaN(pr) || pr < 0) return setError("Enter a valid price.");
    if (isNaN(st) || st < 0) return setError("Enter a valid stock quantity.");
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await api.moderateProduct(p._id, { name: name.trim(), price: pr, stock: st, category: category.trim(), subCategory: subCategory.trim(), isActive: active });
      setNotice(r.message || "Product updated.");
      onSaved();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const images = p.images || [];
  return (
    <>
      <PageHeader backHref="/admin/dashboard/catalog" title={p.name} subtitle={`Listed ${formatDate(p.createdAt)} · SKU ${p.sku || "—"}`} />
      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} />}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <Card className="xl:col-span-2 p-4 space-y-3">
            <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {images[img]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[img].url} alt={p.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-12 h-12 text-slate-300" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((im, i) => (
                  <button key={im.url + i} type="button" onClick={() => setImg(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${i === img ? "border-sky-600" : "border-transparent"}`} aria-label={`Image ${i + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 py-2"><p className="font-extrabold text-sm">{p.ordersCount ?? 0}</p><p className="text-slate-500">Orders</p></div>
              <div className="rounded-lg bg-slate-50 py-2"><p className="font-extrabold text-sm inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{(p.rating ?? 0).toFixed(1)}</p><p className="text-slate-500">{p.numReviews ?? 0} reviews</p></div>
              <div className="rounded-lg bg-slate-50 py-2"><p className="font-extrabold text-sm">{p.status || (p.isActive ? "Active" : "Not Active")}</p><p className="text-slate-500">Status</p></div>
            </div>
          </Card>

          <div className="xl:col-span-3 space-y-4">
            <Card title="Seller" className="">
              <div className="p-5 flex items-center gap-3 text-sm">
                <Store className="w-5 h-5 text-sky-600" />
                <div>
                  <p className="font-bold">{p.vendor?.businessDetails?.businessName || p.vendor?.storeName || "—"}</p>
                  <p className="text-xs text-slate-500">{p.vendor?.sellerDetails?.sellerName} {p.vendor?.sellerDetails?.sellerPhone ? `· ${p.vendor.sellerDetails.sellerPhone}` : ""}</p>
                </div>
                {p.vendor?._id && (
                  <a href={`/admin/dashboard/vendors/${p.vendor._id}`} className={`${btn.outline} h-8 ml-auto`}>View vendor</a>
                )}
              </div>
            </Card>

            <Card title="Moderate listing">
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block sm:col-span-2"><span className={fieldLabel}>Name</span><input className={field} value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label className="block"><span className={fieldLabel}>Price (NPR)</span><input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} /></label>
                <label className="block"><span className={fieldLabel}>Stock</span><input className={field} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} /></label>
                <label className="block"><span className={fieldLabel}>Category</span><input className={field} value={category} onChange={(e) => setCategory(e.target.value)} /></label>
                <label className="block"><span className={fieldLabel}>Subcategory</span><input className={field} value={subCategory} onChange={(e) => setSubCategory(e.target.value)} /></label>
                <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-sky-600" /> Listing is active (visible to customers)
                </label>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="button" disabled={busy} onClick={save} className={btn.primary}><Save className="w-4 h-4" /> {busy ? "Saving…" : "Save Changes"}</button>
                </div>
              </div>
            </Card>

            <Card title="Details">
              <div className="p-5 space-y-3 text-sm">
                <p className="text-slate-700 whitespace-pre-line">{p.description || "No description."}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {[
                    ["Brand", p.brandRef?.name || p.brand || "—"],
                    ["MRP", p.originalPrice ? npr(p.originalPrice) : "—"],
                    ["Unit", p.unit || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-slate-500">{k}</p><p className="font-bold text-slate-900">{v}</p></div>
                  ))}
                </div>
                {!!p.attributes?.length && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.attributes.map((a, i) => <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">{a.name}: {a.value}</span>)}
                  </div>
                )}
                {!!p.variants?.length && (
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-slate-500"><th className="py-1">Variant</th><th>Price</th><th>Stock</th><th>SKU</th></tr></thead>
                    <tbody>
                      {p.variants.map((v, i) => (
                        <tr key={i} className="border-t border-slate-100"><td className="py-1.5">{[v.name, v.value].filter(Boolean).join(": ")}</td><td>{npr(v.price)}</td><td>{v.stock ?? "—"}</td><td>{v.sku || "—"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!!p.tags?.length && <p className="text-xs text-slate-500">Tags: {p.tags.join(", ")}</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
