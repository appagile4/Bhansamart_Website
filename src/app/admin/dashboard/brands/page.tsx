"use client";

import React, { useState } from "react";
import { AlertTriangle, BadgeCheck, Search } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { QueueBrand } from "@/lib/admin/types";
import { formatDate } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";

// app: Screens/adminScreens/brands-review.tsx
const FILTERS = [
  { key: "PENDING", label: "Pending Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All Brands" },
] as const;
const ACTIONS = [
  { key: "APPROVE", label: "Approve Brand", cls: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { key: "REQUEST_INFO", label: "Request Documentation", cls: "border-amber-300 bg-amber-50 text-amber-800" },
  { key: "REJECT", label: "Reject Submission", cls: "border-red-300 bg-red-50 text-red-800" },
] as const;
type Action = (typeof ACTIONS)[number]["key"];
const statusCls = (s: string) => (s === "APPROVED" ? "bg-emerald-50 text-emerald-700" : s === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700");

export default function BrandReviewPage() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]["key"]>("PENDING");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [vendorId, setVendorId] = useState("");
  const vendors = useAsync(() => api.getStoreOptions(), "brand-vendors");
  const [reviewing, setReviewing] = useState<{ b: QueueBrand; action: Action } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const q = useAsync(() => api.getBrandQueue({ status, vendorId: vendorId || undefined, search: search || undefined, page }), `${status}|${vendorId}|${search}|${page}`);

  return (
    <>
      <PageHeader title="Brand Review Queue" subtitle={`${q.data?.total ?? 0} brand submissions`} />
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <Tabs tabs={FILTERS} active={status} onChange={(k) => { setStatus(k); setPage(1); }} />
          <select className={`${field} md:w-56`} value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1); }} aria-label="Filter by store">
            <option value="">All stores</option>
            {(vendors.data?.data || []).map((v) => <option key={v._id} value={v._id}>{v.businessDetails?.businessName || "Store"}</option>)}
          </select>
          <form className="flex gap-2 md:w-96" role="search" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(input.trim()); }}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search brand…" aria-label="Search brands" />
            </div>
            <button type="submit" className={btn.primary}>Search</button>
          </form>
        </div>
        {notice && <SuccessBanner message={notice} />}
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading brands…" />
        ) : !q.data?.brands.length ? (
          <div className="bg-white rounded-2xl border border-slate-100"><EmptyState icon={BadgeCheck} title="No brand submissions" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {q.data.brands.map((b) => (
              <article key={b._id} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <BadgeCheck className="w-6 h-6 text-slate-400" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-900 truncate">{b.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(b.status)}`}>{b.status || "PENDING"}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">By {b.vendor?.storeName || "Vendor"} · {formatDate(b.createdAt)}</p>
                    {b.description && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{b.description}</p>}
                  </div>
                </div>
                {b.similarityWarning && (
                  <p className="flex items-start gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {b.similarityWarning}</p>
                )}
                {(b.reviewerNotes || b.rejectionReason) && <p className="text-[11px] text-slate-600">{b.rejectionReason ? `Rejected: ${b.rejectionReason}` : `Notes: ${b.reviewerNotes}`}{b.reviewedBy?.name ? ` — ${b.reviewedBy.name}` : ""}</p>}
                <div className="flex gap-2">
                  {b.status !== "APPROVED" && <button type="button" onClick={() => setReviewing({ b, action: "APPROVE" })} className={`${btn.success} h-9 flex-1`}>Approve</button>}
                  {b.status !== "REJECTED" && <button type="button" onClick={() => setReviewing({ b, action: "REJECT" })} className={`${btn.danger} h-9 flex-1`}>Reject</button>}
                  <button type="button" onClick={() => setReviewing({ b, action: "REQUEST_INFO" })} className={`${btn.outline} h-9 flex-1`}>Review</button>
                </div>
              </article>
            ))}
          </div>
        )}
        {(q.data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline}>Previous</button>
            <span className="text-sm text-slate-600">Page {page} of {q.data?.totalPages}</span>
            <button type="button" disabled={page >= (q.data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline}>Next</button>
          </div>
        )}
      </div>
      {reviewing && (
        <ReviewModal
          brand={reviewing.b}
          initial={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={(m) => {
            setReviewing(null);
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

function ReviewModal({ brand, initial, onClose, onDone }: { brand: QueueBrand; initial: Action; onClose: () => void; onDone: (m: string) => void }) {
  const [action, setAction] = useState<Action>(initial);
  const [notes, setNotes] = useState(brand.reviewerNotes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (action !== "APPROVE" && !notes.trim()) return setError(`Please provide review notes explaining why you are ${action === "REJECT" ? "rejecting" : "requesting more information for"} this brand.`);
    setBusy(true);
    setError(null);
    try {
      const r = await api.reviewBrand(brand._id, { action, reviewerNotes: notes.trim(), rejectionReason: action === "REJECT" ? notes.trim() : undefined });
      onDone(r.message || `Brand "${brand.name}" updated.`);
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`Review "${brand.name}"`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
          <button type="button" disabled={busy} onClick={save} className={action === "REJECT" ? btn.danger : action === "APPROVE" ? btn.success : btn.primary}>{busy ? "Saving…" : "Submit Review"}</button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-2" role="radiogroup" aria-label="Decision">
          {ACTIONS.map((a) => (
            <button key={a.key} type="button" role="radio" aria-checked={action === a.key} onClick={() => setAction(a.key)} className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold text-left cursor-pointer ${action === a.key ? a.cls : "border-slate-200 text-slate-600"}`}>{a.label}</button>
          ))}
        </div>
        <label className="block">
          <span className={fieldLabel}>Reviewer notes {action !== "APPROVE" && "*"}</span>
          <textarea className={`${field} h-24 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {action === "REQUEST_INFO" && <p className="text-[11px] text-slate-500">The brand stays pending; your notes are saved on the submission.</p>}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
