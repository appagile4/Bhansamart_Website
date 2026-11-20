"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
  Tag,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { RefundClaim } from "@/lib/admin/types";
import { formatDateTime, npr, refundStatusBadge } from "@/lib/seller/format";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  Pill,
  Tabs,
  btn,
  field,
} from "@/components/admin/ui";

// app: staffadminScreens/ReturnsRefundsScreen.tsx — read-only claims log for the assigned stores
const FILTERS = [
  { key: "ALL", label: "All Claims" },
  { key: "REQUESTED", label: "Requested" },
  { key: "APPROVED", label: "Approved" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

type StaffClaim = RefundClaim & {
  items?: Array<{ name?: string; quantity?: number; price?: number; imageUrl?: string }>;
  vendorPaymentDetails?: { confirmedByVendor?: boolean; transactionReference?: string; confirmedAt?: string };
  inspection?: RefundClaim["inspection"] & { quantityCollected?: number; condition?: string; result?: string; notes?: string };
  timeline?: Array<{ status?: string; actorRole?: string; actorName?: string; notes?: string; timestamp?: string }>;
};

const orderNo = (c: StaffClaim) => c.orderNumber || c.order?.orderNumber || "BM-ORDER";
const storeOf = (c: StaffClaim) => c.vendor?.businessDetails?.businessName || c.vendor?.brandDetails?.brandName || "Assigned Store";
const isCod = (c: StaffClaim) =>
  c.isVendorFunded ||
  (c.originalPaymentMethod || "").toLowerCase().includes("cash") ||
  /cod/i.test(c.originalPaymentMethod || "");

export default function StaffRefundsPage() {
  const [status, setStatus] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [selected, setSelected] = useState<StaffClaim | null>(null);

  // Fetch store options for assigned stores filter
  const storesQ = useAsync(() => api.getStoreOptions(), "staff-stores");

  // Fetch refund claims queue
  const q = useAsync(async () => {
    const res = await api.getRefundQueue({
      status: status !== "ALL" ? status : undefined,
      vendorId: vendorFilter !== "all" ? vendorFilter : undefined,
      limit: 100,
    });
    return {
      refunds: (res.refunds || []) as StaffClaim[],
      summary: res.summary || null,
      total: res.total || 0,
    };
  }, `${status}|${vendorFilter}`);

  const rawList = q.data?.refunds || [];
  const summary = q.data?.summary;

  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rawList;
    return rawList.filter((r) =>
      [orderNo(r), r.refundNumber || "", r.customer?.name || "", storeOf(r), r.reason || ""].some((v) =>
        v.toLowerCase().includes(s)
      )
    );
  }, [rawList, search]);

  // Compute counts for tabs
  const tabCounts = useMemo(() => {
    return {
      ALL: summary?.total ?? rawList.length,
      REQUESTED: summary?.pending ?? rawList.filter((r) => ["REQUESTED", "VENDOR_REVIEW", "STAFF_EXAMINING"].includes(r.status)).length,
      APPROVED: summary?.approved ?? rawList.filter((r) => ["APPROVED", "FORWARDED_TO_FINANCE", "PROCESSING"].includes(r.status)).length,
      COMPLETED: summary?.completed ?? rawList.filter((r) => r.status === "COMPLETED").length,
      REJECTED: summary?.rejected ?? rawList.filter((r) => ["REJECTED", "VENDOR_REJECTED", "FAILED"].includes(r.status)).length,
    };
  }, [summary, rawList]);

  return (
    <>
      <PageHeader
        title="Returns & Refund Claims"
        subtitle="Read-only claims and audit logs for your assigned stores"
      />

      <div className="space-y-4">
        {/* Staff Admin Notice Banner (Matching Mobile App) */}
        <div className="p-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-sky-50/70 to-blue-50/50 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xs text-sky-950 flex-1 leading-relaxed">
            <p className="font-extrabold text-sm text-sky-900 mb-0.5">Staff Admin Read-Only Monitor</p>
            <p className="text-sky-800">
              Super Admin processes online refunds; Vendors settle COD claims directly. Staff Admins have read-only
              monitoring permissions and cannot execute financial payouts or state overrides.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Claims</span>
              <RotateCcw className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{tabCounts.ALL}</p>
            <span className="text-[10px] text-slate-400">Assigned store records</span>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">In Review / Pending</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-900 mt-1">{tabCounts.REQUESTED}</p>
            <span className="text-[10px] text-amber-700">Awaiting vendor or admin</span>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed / Settled</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-900 mt-1">{tabCounts.COMPLETED}</p>
            <span className="text-[10px] text-emerald-700">Payout confirmed</span>
          </div>

          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/40 shadow-xs">
            <div className="flex items-center justify-between text-red-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Declined / Rejected</span>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-black text-red-900 mt-1">{tabCounts.REJECTED}</p>
            <span className="text-[10px] text-red-700">Closed with reason</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between pt-1">
          <Tabs tabs={FILTERS} active={status} onChange={setStatus} counts={tabCounts} />

          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                className={`${field} pl-9 pr-8 text-xs h-10`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, claim #, customer, store…"
                aria-label="Search claims"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {storesQ.data?.data && storesQ.data.data.length > 0 && (
              <select
                className={`${field} text-xs h-10 w-44 shrink-0`}
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="all">All Assigned Stores</option>
                {storesQ.data.data.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.businessDetails?.businessName || "Store"}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content */}
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

        {q.loading && !q.data ? (
          <LoadingBlock text="Loading refund claims queue…" />
        ) : !list.length ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <EmptyState
              icon={RotateCcw}
              title="No return or refund claims found"
              text={search ? `No claims matching "${search}". Try clearing your search.` : "No claims in this category for your assigned stores."}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((c) => {
              const cod = isCod(c);
              const productName = c.items?.[0]?.name || (c.order as any)?.items?.[0]?.name || "Purchased product";
              const productQty = c.items?.[0]?.quantity || 1;
              const storeTitle = storeOf(c);
              const custTitle = c.customer?.name || c.order?.shippingAddress?.fullName || "Customer";

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-sky-400 p-4 space-y-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Claim Number & Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0">
                        <span className="font-black text-sm text-sky-700 tracking-tight block">
                          {c.refundNumber || "REF-CLAIM"}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 block truncate">
                          Order #{orderNo(c)}
                        </span>
                      </div>
                      <Pill badge={refundStatusBadge(c.status || "REQUESTED")} />
                    </div>

                    {/* Scope: Store & Customer Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400" /> Store
                        </span>
                        <span className="font-extrabold text-slate-800 truncate block mt-0.5" title={storeTitle}>
                          {storeTitle}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> Customer
                        </span>
                        <span className="font-extrabold text-slate-800 truncate block mt-0.5" title={custTitle}>
                          {custTitle}
                        </span>
                      </div>
                    </div>

                    {/* Product Details & Amount Box */}
                    <div className="rounded-xl p-3 bg-slate-50/80 border border-slate-200/70 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 truncate" title={productName}>
                          {productName} × {productQty}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Type: <span className="font-bold text-sky-700">{c.claimType || "RETURN"}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Refund
                        </span>
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {npr(c.amount || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Handler Pill: COD vs Online Distinction */}
                    <div
                      className={`rounded-xl px-3 py-2 text-[11px] font-semibold flex items-start gap-2 border ${
                        cod
                          ? "bg-amber-50/80 text-amber-900 border-amber-200"
                          : "bg-sky-50/80 text-sky-950 border-sky-200"
                      }`}
                    >
                      {cod ? (
                        <Banknote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 leading-tight">
                        <span className="font-extrabold uppercase tracking-wide block">
                          {cod ? "COD · Vendor Direct Settlement" : "Online · Super Admin Platform Refund"}
                        </span>
                        <span className="opacity-90 block mt-0.5">
                          {cod
                            ? c.status === "COMPLETED"
                              ? "Vendor confirmed paid"
                              : "Pending vendor payment"
                            : c.status === "COMPLETED"
                            ? "Super Admin completed"
                            : "Pending Super Admin processing"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="w-full h-9 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 text-slate-700 hover:text-sky-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>View Read-Only Audit Log</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Read-Only Audit Detail Modal ── */}
      {selected && <ClaimModal c={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-[11px] transition-colors cursor-pointer"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ClaimModal({ c, onClose }: { c: StaffClaim; onClose: () => void }) {
  const cod = isCod(c);
  const storeTitle = storeOf(c);
  const custName = c.customer?.name || c.order?.shippingAddress?.fullName || "Customer";
  const custPhone = c.customer?.phone || c.order?.shippingAddress?.phone || "";
  const photos = c.proofImages?.length ? c.proofImages : c.images || [];

  return (
    <Modal
      open
      wide
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
            <FileText className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              Claim Audit #{c.refundNumber || "REF-CLAIM"}
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Order #{orderNo(c)} · Requested {formatDateTime(c.createdAt)}
            </p>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400 font-medium">Read-Only Staff Admin Scope</span>
          <button type="button" onClick={onClose} className={`${btn.primary} bg-sky-600 hover:bg-sky-700 h-9 px-5`}>
            Close Log
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {/* Status & Financial Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Claim Status</span>
            <div className="mt-1">
              <Pill badge={refundStatusBadge(c.status)} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Refund Amount</span>
            <span className="text-base font-black text-slate-900 block mt-0.5">{npr(c.amount || 0)}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Claim Type</span>
            <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full inline-block mt-1">
              {c.claimType || "RETURN"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Mode</span>
            <span className="text-xs font-bold text-slate-700 block mt-1">
              {c.originalPaymentMethod || (cod ? "Cash on Delivery" : "Online Gateway")}
            </span>
          </div>
        </div>

        {/* Scope: Store & Customer Details */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Scope Details</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Store:</span>{" "}
              <strong className="text-slate-900">{storeTitle}</strong>
            </div>
            <div>
              <span className="text-slate-400">Customer:</span>{" "}
              <strong className="text-slate-900">{custName}</strong>
              {custPhone ? ` (${custPhone})` : ""}
            </div>
          </div>
        </div>

        {/* Refund Payout Accountability Block */}
        <div
          className={`rounded-xl border p-4 space-y-2 ${
            cod ? "bg-amber-50/60 border-amber-200 text-amber-950" : "bg-sky-50/60 border-sky-200 text-sky-950"
          }`}
        >
          <div className="flex items-center gap-2">
            {cod ? <Banknote className="w-4 h-4 text-amber-600" /> : <ShieldCheck className="w-4 h-4 text-sky-600" />}
            <span className="text-xs font-black uppercase tracking-wider">
              {cod ? "Vendor COD Settlement Accountability" : "Super Admin Online Gateway Payout"}
            </span>
          </div>

          {cod ? (
            <div className="text-xs space-y-1 text-amber-900">
              <p>
                <strong>Handler:</strong> Responsible Vendor ({storeTitle}) manages and disburses payout directly.
              </p>
              <p>
                <strong>Vendor Status:</strong>{" "}
                <span className="font-bold">
                  {c.vendorPaymentDetails?.confirmedByVendor ? "Vendor Confirmed Paid" : "Pending Vendor Payment"}
                </span>
              </p>
              {c.vendorPaymentDetails?.transactionReference && (
                <p className="flex items-center gap-1 font-mono">
                  <span>Vendor Payment Ref:</span>
                  <code className="bg-white/80 px-1.5 py-0.5 rounded font-bold">{c.vendorPaymentDetails.transactionReference}</code>
                  <CopyButton value={c.vendorPaymentDetails.transactionReference} label="Vendor Reference" />
                </p>
              )}
            </div>
          ) : (
            <div className="text-xs space-y-1 text-sky-900">
              <p>
                <strong>Handler:</strong> Super Admin platform treasury executes online gateway / bank reversal.
              </p>
              <p>
                <strong>Super Admin Status:</strong>{" "}
                <span className="font-bold">{c.status === "COMPLETED" ? "Refund Executed" : c.status}</span>
              </p>
              {c.customerPayoutDetails?.payoutReference && (
                <p className="flex items-center gap-1 font-mono">
                  <span>Gateway Ref:</span>
                  <code className="bg-white/80 px-1.5 py-0.5 rounded font-bold">{c.customerPayoutDetails.payoutReference}</code>
                  <CopyButton value={c.customerPayoutDetails.payoutReference} label="Gateway Reference" />
                </p>
              )}
            </div>
          )}
        </div>

        {/* Customer Reason & Description */}
        <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5 bg-white">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer Reason</span>
          <p className="text-xs font-bold text-slate-800">{c.reason || "No explicit reason specified"}</p>
          {c.description && <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>}
        </div>

        {/* Customer Proof Photos */}
        {photos.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer Proof Photos ({photos.length})
            </span>
            <div className="flex flex-wrap gap-2.5">
              {photos.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block w-16 h-16 rounded-xl border border-slate-200 overflow-hidden hover:border-sky-500 shadow-2xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quality Inspection Report */}
        {c.inspection && c.inspection.result && c.inspection.result !== "NOT_REQUIRED" && (
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-1.5 bg-white">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Physical Quality Inspection
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Condition Grade:</span>
              <span className="font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                {c.inspection.condition || "INSPECTED"}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Verdict:</span>
              <span className="font-bold text-slate-800">{c.inspection.result}</span>
            </div>
            {c.inspection.notes && <p className="text-xs text-slate-600 italic">Notes: {c.inspection.notes}</p>}
          </div>
        )}

        {/* Audit Trail Timeline */}
        {c.timeline && c.timeline.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-white">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Audit Event Timeline ({c.timeline.length})
            </span>
            <div className="divide-y divide-slate-100 text-xs">
              {c.timeline.map((evt, idx) => (
                <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">{evt.status?.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-400">{evt.timestamp ? formatDateTime(evt.timestamp) : ""}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      By {evt.actorName || evt.actorRole || "System"} ({evt.actorRole || "role"})
                    </p>
                    {evt.notes && <p className="text-xs text-slate-700 mt-0.5">{evt.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Read-Only Restriction Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          Staff Admin accounts have read-only audit permissions. All operational actions must be performed by Super Admin or the responsible Vendor.
        </div>
      </div>
    </Modal>
  );
}
