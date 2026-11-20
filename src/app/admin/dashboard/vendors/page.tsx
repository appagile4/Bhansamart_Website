"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid, List, Search, Store, XCircle } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminVendor } from "@/lib/admin/types";
import { npr } from "@/lib/seller/format";
import { storeName, vendorStatusBadge } from "@/lib/admin/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";

// app: AdminMain/vendors.tsx verification chips
const FILTERS = [
  { key: "", label: "All Stores" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending KYC" },
  { key: "rejected", label: "Rejected" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];
const PAGE_SIZE = 24;

export default function AdminVendorsPage() {
  const [filter, setFilter] = useState<FilterKey>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [rejecting, setRejecting] = useState<AdminVendor | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const q = useAsync(() => api.getVendors({ search: search || undefined, verification: filter || undefined, page, limit: PAGE_SIZE }), `${search}|${filter}|${page}`);

  const verify = async (v: AdminVendor, status: "approved" | "rejected", reason?: string) => {
    setBusyId(v._id);
    setActionError(null);
    setNotice(null);
    try {
      await api.setVendorVerification(v._id, status, reason);
      setNotice(`${storeName(v)} is now ${status}.`);
      setRejecting(null);
      q.reload();
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setBusyId(null);
    }
  };

  const vendors = q.data?.data || [];

  return (
    <>
      <PageHeader title="Vendors & KYC" subtitle={`${q.data?.total ?? 0} stores on the platform`} />
      <div className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
          role="search"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search store, owner, email or phone…"
              aria-label="Search vendors"
              className="w-full h-11 bg-white text-sm pl-10 pr-4 rounded-xl border border-slate-200 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none"
            />
          </div>
          <button type="submit" className={btn.primary}>
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={FILTERS}
            active={filter}
            onChange={(k) => {
              setFilter(k);
              setPage(1);
            }}
          />
          <div className="flex rounded-lg border border-slate-200 overflow-hidden" role="group" aria-label="View mode">
            {(["grid", "list"] as const).map((m) => {
              const Icon = m === "grid" ? LayoutGrid : List;
              return (
                <button key={m} type="button" onClick={() => setView(m)} aria-pressed={view === m} aria-label={`${m} view`} className={`w-9 h-9 flex items-center justify-center cursor-pointer ${view === m ? "bg-sky-700 text-white" : "bg-white text-slate-500"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {notice && <SuccessBanner message={notice} />}
        {(q.error || actionError) && <ErrorBanner message={(q.error || actionError)!} onRetry={q.error ? q.reload : undefined} />}

        {q.loading && !q.data ? (
          <LoadingBlock text="Loading vendors…" />
        ) : vendors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState icon={Store} title="No vendors found" text={search ? "Try a different search." : undefined} />
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4" : "bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100"}>
            {vendors.map((v) => {
              const b = vendorStatusBadge(v.status);
              const approved = b.label === "Approved";
              const owner = v.sellerDetails?.sellerName || (typeof v.userId === "object" ? v.userId?.name : "") || "—";
              const body = (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {v.brandDetails?.brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.brandDetails.brandLogo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-5 h-5 text-slate-400" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link href={`/admin/dashboard/vendors/${v._id}`} className="text-sm font-extrabold text-slate-900 hover:text-sky-700 line-clamp-1">
                        {storeName(v)}
                      </Link>
                      <p className="text-xs text-slate-500 truncate">
                        {owner} · {v.sellerDetails?.city || v.shippingLocations?.city || "—"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${b.cls}`}>{b.label}</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${v.isStoreOpen ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {v.isStoreOpen ? "Open" : "Closed"}
                        </span>
                        {v.assignedAdmin?.name && <span className="px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-semibold text-slate-600">Staff: {v.assignedAdmin.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mt-3">
                    {[
                      ["Orders", String(v.totalOrders ?? 0)],
                      ["Gross Sales", npr(v.totalGrossSales)],
                      ["Wallet", npr(v.wallet?.currentBalance)],
                    ].map(([k, val]) => (
                      <div key={k} className="rounded-lg bg-slate-50 py-2">
                        <p className="text-sm font-extrabold text-slate-900 truncate px-1">{val}</p>
                        <p className="text-[10px] text-slate-500">{k}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {!approved ? (
                      <button type="button" disabled={busyId === v._id} onClick={() => verify(v, "approved")} className={`${btn.success} h-9 flex-1`}>
                        <CheckCircle2 className="w-4 h-4" /> Approve Store
                      </button>
                    ) : (
                      <button type="button" disabled={busyId === v._id} onClick={() => setRejecting(v)} className={`${btn.danger} h-9 flex-1`}>
                        <XCircle className="w-4 h-4" /> Revoke
                      </button>
                    )}
                    <Link href={`/admin/dashboard/vendors/${v._id}`} className={`${btn.outline} h-9 flex-1`}>
                      View Details
                    </Link>
                  </div>
                </>
              );
              return view === "grid" ? (
                <article key={v._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  {body}
                </article>
              ) : (
                <div key={v._id} className="p-4">
                  {body}
                </div>
              );
            })}
          </div>
        )}

        {(q.data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline} aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {q.data?.totalPages}
            </span>
            <button type="button" disabled={page >= (q.data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline} aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {rejecting && <RejectVendorModal vendor={rejecting} busy={busyId === rejecting._id} onClose={() => setRejecting(null)} onConfirm={(reason) => verify(rejecting, "rejected", reason)} />}
    </>
  );
}

function RejectVendorModal({ vendor, busy, onClose, onConfirm }: { vendor: AdminVendor; busy: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      open
      title={`Revoke ${storeName(vendor)}?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={() => onConfirm(reason.trim())} className={btn.danger}>
            {busy ? "Revoking…" : "Revoke Access"}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 mb-3">The store loses access to the seller dashboard until it is approved again. The reason is recorded in the audit log.</p>
      <label className="block">
        <span className={fieldLabel}>Reason (optional)</span>
        <textarea className={`${field} h-24 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. KYC documents expired" />
      </label>
    </Modal>
  );
}
