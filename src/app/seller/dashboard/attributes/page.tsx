"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, PackagePlus, Plus, Search, SlidersHorizontal, Sparkles, Tags } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDate } from "@/lib/seller/format";
import BrandRequestModal from "@/components/vendor/BrandRequestModal";
import AttributeModal from "@/components/vendor/AttributeModal";
import { Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader, SuccessBanner, Tabs, btn, field } from "@/components/vendor/ui";

const TABS = [
  { key: "brands", label: "Brands" },
  { key: "attributes", label: "Attributes" },
  { key: "requests", label: "My Brand Requests" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function BrandsAttributesPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <BrandsAttributesView />
    </Suspense>
  );
}

function BrandsAttributesView() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "brands";
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [brandModal, setBrandModal] = useState(false);
  const [attrModal, setAttrModal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const catsQ = useAsync(() => api.getCategories(), "categories");
  const brands = useAsync(() => api.getBrands({ category: category || undefined, limit: 200 }), `b-${category}`);
  const attrs = useAsync(() => api.getAttributes({ category: category || undefined }), `a-${category}`);
  const requests = useAsync(() => api.getMyBrandRequests(), "requests");

  const q = search.trim().toLowerCase();
  const brandList = useMemo(() => (brands.data || []).filter((b) => b.status === "APPROVED" && (!q || b.name.toLowerCase().includes(q))), [brands.data, q]);
  const attrList = useMemo(() => (attrs.data || []).filter((a) => !q || a.name.toLowerCase().includes(q) || a.values.some((v) => v.toLowerCase().includes(q))), [attrs.data, q]);
  const reqList = useMemo(() => (requests.data || []).filter((b) => !q || b.name.toLowerCase().includes(q)), [requests.data, q]);

  const statusCls = (s: string) =>
    s === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <>
      <PageHeader
        title="Brands & Attributes"
        subtitle="Brands and attributes you can use when listing products."
        actions={
          <>
            <Link href="/seller/dashboard/products/add" className={btn.ghost}>
              <PackagePlus className="w-4 h-4" /> Add Product
            </Link>
            <button type="button" onClick={() => setAttrModal(true)} className={btn.outline}>
              <SlidersHorizontal className="w-4 h-4" /> Add Attribute
            </button>
            <button type="button" onClick={() => setBrandModal(true)} className={btn.primary}>
              <Plus className="w-4 h-4" /> Request Brand
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(k) => router.replace(`/seller/dashboard/attributes?tab=${k}`)}
          counts={{ brands: brandList.length, attributes: attrList.length, requests: requests.data?.length || 0 }}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab === "attributes" ? "attributes or values" : "brands"}…`} aria-label="Search" />
          </div>
          {tab !== "requests" && (
            catsQ.loading && !catsQ.data ? (
              <div className="h-10 w-full sm:w-64 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
            ) : (
              <select className={`${field} sm:w-64`} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                <option value="">All categories</option>
                {(catsQ.data || []).map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )
          )}
        </div>

        {tab === "brands" && (
          <Card>
            {brands.error && <div className="p-4"><ErrorBanner message={brands.error} onRetry={brands.reload} /></div>}
            {brands.loading && !brands.data ? (
              <LoadingBlock text="Loading brands…" />
            ) : brandList.length === 0 ? (
              <EmptyState icon={Tags} title="No brands found" text="Can't find your brand? Request it and our team will review it." action={<button type="button" onClick={() => setBrandModal(true)} className={btn.primary}>Request Brand</button>} />
            ) : (
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
                {brandList.map((b) => (
                  <div key={b._id} className="rounded-xl border border-slate-200 p-3 flex flex-col items-center text-center gap-2">
                    <span className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center">
                      {b.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-slate-300" />
                      )}
                    </span>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{b.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{b.categories?.join(", ") || "All categories"}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === "attributes" && (
          <Card>
            {attrs.error && <div className="p-4"><ErrorBanner message={attrs.error} onRetry={attrs.reload} /></div>}
            {attrs.loading && !attrs.data ? (
              <LoadingBlock text="Loading attributes…" />
            ) : attrList.length === 0 ? (
              <EmptyState icon={SlidersHorizontal} title="No attributes found" action={<button type="button" onClick={() => setAttrModal(true)} className={btn.primary}>Add Attribute</button>} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {attrList.map((a) => (
                  <li key={a._id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-vendor-dark">{a.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{a.type || "single"}</span>
                      {a.isGlobal && <span className="px-2 py-0.5 rounded-full bg-vendor-soft text-vendor-dark text-[10px] font-bold">GLOBAL</span>}
                      <span className="text-[11px] text-slate-500">{a.categories?.join(", ")}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {a.values.map((v) => (
                        <span key={v} className="px-2 py-0.5 rounded-md bg-vendor-soft text-vendor-dark text-[11px] font-semibold">
                          {v}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "requests" && (
          <Card>
            {requests.error && <div className="p-4"><ErrorBanner message={requests.error} onRetry={requests.reload} /></div>}
            {requests.loading && !requests.data ? (
              <LoadingBlock text="Loading requests…" />
            ) : reqList.length === 0 ? (
              <EmptyState icon={Clock} title="No brand requests" text="Brands you request appear here with their review status." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {reqList.map((b) => (
                  <li key={b._id} className="px-5 py-4 flex items-center gap-4">
                    <span className="w-12 h-12 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {b.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-slate-300" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{b.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {b.categories?.join(", ")} · Requested {formatDate(b.createdAt)}
                      </p>
                      {b.status === "REJECTED" && b.rejectionReason && <p className="text-[11px] text-red-600 mt-0.5">Reason: {b.rejectionReason}</p>}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusCls(b.status)}`}>{b.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <BrandRequestModal
        open={brandModal}
        onClose={() => setBrandModal(false)}
        defaultCategory={category || undefined}
        availableCategories={(catsQ.data || []).map((c) => c.name)}
        onSubmitted={(m) => {
          setNotice(m);
          requests.reload();
          brands.reload();
          router.replace("/seller/dashboard/attributes?tab=requests");
        }}
      />
      <AttributeModal
        open={attrModal}
        onClose={() => setAttrModal(false)}
        defaultCategory={category || undefined}
        availableCategories={(catsQ.data || []).map((c) => c.name)}
        onSubmitted={(m) => {
          setNotice(m);
          attrs.reload();
          router.replace("/seller/dashboard/attributes?tab=attributes");
        }}
      />
    </>
  );
}
