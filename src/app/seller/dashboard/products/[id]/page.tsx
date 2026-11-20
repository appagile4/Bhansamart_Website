"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, ChevronLeft, ChevronRight, Eye, Package, Pencil, RotateCcw, ShoppingBag, Star, Trash2, TrendingUp } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate, isLowStock, isOutOfStock, npr } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, StatCard, btn } from "@/components/vendor/ui";

export default function ProductDetailPage() {
  // useParams() reads URL data — it must sit under a Suspense boundary for prerendering
  return (
    <Suspense fallback={<LoadingBlock text="Loading product details…" />}>
      <ProductDetailView />
    </Suspense>
  );
}

function ProductDetailView() {
  const { id } = useParams<{ id: string }>();
  const product = useAsync(() => api.getProduct(id), id);
  const reviews = useAsync(() => api.getProductReviews(id), `r-${id}`);

  const [imgIdx, setImgIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [toggling, setToggling] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const p = product.data;
  if (product.loading && !p) return <LoadingBlock text="Loading product details…" />;
  if (!p) return <ErrorBanner message={product.error || "Product not found."} onRetry={product.reload} />;

  const images = p.images?.length ? p.images : [];
  const img = images[Math.min(imgIdx, Math.max(0, images.length - 1))];
  const variants = p.variants || [];
  const variant = variants[variantIdx];
  const price = variant?.price || p.price;
  const views = p.views || 0;
  const orders = p.ordersCount || 0;
  const conversion = p.conversionRate ?? (views ? Math.round((orders / views) * 100) : 0);
  const refundRate = p.returnRefundRate ?? (orders ? Math.round(((p.refundsCount || 0) / orders) * 100) : 0);
  const available = p.inStock !== false;

  const toggleStock = async () => {
    setToggling(true);
    setActionError(null);
    try {
      const r = await api.toggleProductStock(p._id);
      product.setData((prev) => (prev ? { ...prev, inStock: r.inStock, status: r.status ?? prev.status } : prev));
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setToggling(false);
    }
  };

  const doDeleteReview = async () => {
    if (!reviewToDelete) return;
    try {
      await api.deleteProductReview(p._id, reviewToDelete.id);
      setReviewToDelete(null);
      reviews.reload();
      product.reload();
    } catch (e) {
      setActionError(api.errorText(e));
      setReviewToDelete(null);
    }
  };

  const yesNo = (v?: boolean, extra?: string) => (v ? `Yes${extra ? ` (${extra})` : ""}` : "No");
  const r = reviews.data;
  const total = r?.count || 0;
  const avg = total ? r?.averageRating || 0 : 0; // backend reports 5.0 when there are no reviews

  return (
    <>
      <PageHeader
        backHref="/seller/dashboard/products"
        title={p.name}
        subtitle={`SKU ${p.sku || "—"} · Added ${formatDate(p.createdAt)}`}
        actions={
          <>
            <Link href={`/seller/dashboard/products/add?edit=${p._id}`} className={btn.primary}>
              <Pencil className="w-4 h-4" /> Edit Product
            </Link>
          </>
        }
      />

      <div className="space-y-4">
        {actionError && <ErrorBanner message={actionError} />}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Image showcase */}
          <Card className="lg:col-span-2 p-4">
            <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt={img.altText || p.name} className="w-full h-full object-contain" />
              ) : (
                <Package className="w-16 h-16 text-slate-300" />
              )}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer" aria-label="Previous image">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer" aria-label="Next image">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                {images.map((im, i) => (
                  <button
                    key={im.url + i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    aria-label={`Image ${i + 1}`}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${i === imgIdx ? "border-vendor-dark" : "border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Product info */}
          <Card className="lg:col-span-3 p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${p.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-300"}`}>
                {p.status || "Active"}
              </span>
              {isOutOfStock(p) ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Out of stock</span>
              ) : isLowStock(p) ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Low stock</span>
              ) : null}
              {p.visibility?.isFeatured && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-vendor-soft text-vendor-dark">Featured</span>}
              {p.visibility?.isBestSeller && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-vendor-soft text-vendor-dark">Best Seller</span>}
              {p.visibility?.isNewArrival && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-vendor-soft text-vendor-dark">New Arrival</span>}
            </div>

            <div className="flex items-end justify-between gap-4 flex-wrap">
              <p>
                <span className="text-3xl font-extrabold text-slate-900">{npr(price)}</span>
                {!!p.originalPrice && p.originalPrice > price && <span className="ml-2 text-sm text-slate-400 line-through">{npr(p.originalPrice)}</span>}
                {p.discountCategory && p.discountCategory !== "No Discount" && (
                  <span className="ml-2 text-xs font-bold text-emerald-700">
                    {p.discountCategory}
                    {p.discountValue ? ` · ${p.discountValue}` : ""}
                  </span>
                )}
              </p>
              <button type="button" onClick={toggleStock} disabled={toggling} role="switch" aria-checked={available} className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer disabled:opacity-60">
                <span className={`relative w-11 h-6 rounded-full transition-colors ${available ? "bg-vendor-done" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${available ? "left-5.5" : "left-0.5"}`} />
                </span>
                {available ? "Available" : "Disabled"}
              </button>
            </div>

            {p.description && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.description}</p>}

            {!!p.tags?.length && (
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {variants.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Variation Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((vr, i) => (
                    <button
                      key={(vr.id || "") + i}
                      type="button"
                      onClick={() => setVariantIdx(i)}
                      aria-pressed={i === variantIdx}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${i === variantIdx ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600"}`}
                    >
                      {vr.weightValue} {vr.weightUnit}
                      {vr.color ? ` · ${vr.color}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {[
                ["Product Category", p.category],
                ["Sub-Category", p.subCategory || "—"],
                ["Brand", (typeof p.brandRef === "object" && p.brandRef?.name) || p.brand || "—"],
                ["Supplier Name", p.supplierName || "—"],
                ["Stock Quantity", `${p.stock}${p.reorderLevel ? ` (reorder at ${p.reorderLevel})` : ""}`],
                ["Shelf Life / Expiry", p.expirationDate ? formatDate(p.expirationDate) : "—"],
                ["Return", yesNo(p.isReturnable, p.isReturnable ? `${p.returnWindowDays || 7} days` : undefined)],
                ["Replacement", yesNo(p.isReplaceable)],
                ["Refund", yesNo(p.isRefundable)],
              ].map(([k, val]) => (
                <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                  <dd className="mt-1 font-semibold text-slate-900 break-words">{val}</dd>
                </div>
              ))}
            </dl>

            {!!p.attributes?.length && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Attributes</p>
                <div className="flex flex-wrap gap-2">
                  {p.attributes.map((a) => (
                    <span key={a.name} className="px-2.5 py-1 rounded-lg bg-vendor-soft text-vendor-dark text-[11px] font-semibold">
                      {a.name}: {a.values?.join(", ") || a.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Performance metrics — app: Performance Metric card */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Views" value={views.toLocaleString()} icon={Eye} />
          <StatCard label="Orders" value={orders.toLocaleString()} icon={ShoppingBag} tone="blue" />
          <StatCard label="Conversion Rate" value={`${conversion}%`} icon={TrendingUp} tone="green" />
          <StatCard label="Return & Refund" value={`${refundRate}%`} icon={RotateCcw} tone="red" />
        </div>

        {/* Rating & reviews */}
        <Card title="Rating & Review">
          {reviews.loading && !r ? (
            <LoadingBlock text="Loading reviews…" />
          ) : (
            <div className="p-5 space-y-5">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="text-center sm:w-40 shrink-0">
                  <p className="text-4xl font-extrabold text-slate-900">{avg.toFixed(1)}</p>
                  <Stars value={avg} />
                  <p className="text-xs text-slate-500 mt-1">{total} review(s)</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = r?.breakdown?.[star] || 0;
                    const pct = total ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-slate-600 font-semibold">{star}★</span>
                        <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <span className="block h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="w-8 text-right text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {r?.reviews?.length ? (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {r.reviews.map((rev) => (
                    <li key={rev._id} className="py-3 flex gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {rev.userName || "Customer"}
                          {rev.isVerifiedBuyer && <BadgeCheck className="w-4 h-4 text-vendor-done" aria-label="Verified buyer" />}
                          <span className="text-[11px] font-normal text-slate-400">{formatDate(rev.createdAt)}</span>
                        </p>
                        <Stars value={rev.rating} small />
                        {rev.comment && <p className="text-xs text-slate-600 mt-1">{rev.comment}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewToDelete({ id: rev._id, name: rev.userName || "this customer" })}
                        className="self-start p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        aria-label="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Star} title="No reviews yet" text="Customer reviews for this product will appear here." />
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(reviewToDelete)}
        title="Delete review?"
        onClose={() => setReviewToDelete(null)}
        footer={
          <>
            <button type="button" onClick={() => setReviewToDelete(null)} className={btn.ghost}>
              Cancel
            </button>
            <button type="button" onClick={doDeleteReview} className={btn.danger}>
              Delete Review
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Remove the review by {reviewToDelete?.name}? The product rating will be recalculated. This cannot be undone.</p>
      </Modal>
    </>
  );
}

function Stars({ value, small = false }: { value: number; small?: boolean }) {
  return (
    <span className="inline-flex gap-0.5 mt-1" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${small ? "w-3 h-3" : "w-4 h-4"} ${s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      ))}
    </span>
  );
}
