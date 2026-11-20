"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  Banknote,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Store,
  Truck,
  X,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { RefundClaim } from "@/lib/admin/types";
import { formatDateTime, npr, type Badge } from "@/lib/seller/format";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  Pill,
  SuccessBanner,
  Tabs,
  btn,
  field,
  fieldLabel,
} from "@/components/admin/ui";

// app: Screens/adminScreens/refunds-workflow.tsx — 4-step workflow: Store → Staff → Item Check → Refund
const STAGES = [
  { key: "ALL", label: "All Requests" },
  { key: "VENDOR_REVIEW", label: "Store Review" },
  { key: "STAFF_EXAMINING", label: "Staff Checking" },
  { key: "RETURN_PICKUP_SCHEDULED", label: "Return Pickup" },
  { key: "RETURN_RECEIVED", label: "Quality Check" },
  { key: "FORWARDED_TO_FINANCE", label: "Ready to Refund" },
  { key: "COMPLETED", label: "Refunded" },
  { key: "REJECTED", label: "Rejected" },
] as const;
type Stage = (typeof STAGES)[number]["key"];

const statusBadge = (s: string): Badge => {
  switch (s) {
    case "COMPLETED":
      return { label: "Refunded", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "FORWARDED_TO_FINANCE":
    case "APPROVED":
    case "PROCESSING":
    case "INSPECTED_PASSED":
      return { label: "Ready to Refund", cls: "bg-violet-50 text-violet-700 border-violet-200" };
    case "STAFF_EXAMINING":
      return { label: "Staff Checking", cls: "bg-sky-50 text-sky-700 border-sky-200" };
    case "VENDOR_REVIEW":
    case "REQUESTED":
    case "VENDOR_INFO_REQUIRED":
      return { label: "Store Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "RETURN_PICKUP_SCHEDULED":
    case "RETURN_PICKED_UP":
      return { label: "Rider Picking Up", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "RETURN_RECEIVED":
      return { label: "Quality Check", cls: "bg-yellow-50 text-yellow-800 border-yellow-200" };
    case "REJECTED":
    case "VENDOR_REJECTED":
    case "FAILED":
    case "INSPECTED_FAILED":
      return { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { label: s, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  }
};

const isRejectedStatus = (s: string) => ["REJECTED", "VENDOR_REJECTED", "FAILED", "INSPECTED_FAILED"].includes(s);
const orderNo = (c: RefundClaim) => c.orderNumber || c.order?.orderNumber || (c.order?._id ? c.order._id.slice(-8) : "N/A");
const customerName = (c: RefundClaim) => c.customer?.name || c.order?.shippingAddress?.fullName || "Customer";
const vendorName = (c: RefundClaim) => c.vendor?.businessDetails?.businessName || c.vendor?.brandDetails?.brandName || "Store";
const amountOf = (c: RefundClaim) => c.amount || c.order?.totalAmount || 0;
const payMethod = (c: RefundClaim) => c.originalPaymentMethod || c.order?.paymentMethod || "COD";
const isCod = (c: RefundClaim) => c.isVendorFunded === true || /cod|cash/i.test(payMethod(c));
const photosOf = (c: RefundClaim) => (c.proofImages?.length ? c.proofImages : c.images || []);
const riderOf = (c: RefundClaim) => (c.pickup?.deliveryBoy && typeof c.pickup.deliveryBoy === "object" ? c.pickup.deliveryBoy : null);

type ModalKind = "EXAMINE" | "PICKUP" | "INSPECTION" | "FINALIZE" | "AUDIT";

export default function RefundsPage() {
  const [type, setType] = useState<"vendor" | "my">("vendor");
  const [stage, setStage] = useState<Stage>("ALL");
  const [vendorId, setVendorId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<{ kind: ModalKind; claim: RefundClaim } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-dismiss floating toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const vendors = useAsync(() => api.getStoreOptions(), "vendors");
  const q = useAsync(
    () => api.getRefundQueue({ refundType: type, status: stage, vendorId: vendorId || undefined, page }),
    `${type}|${stage}|${vendorId}|${page}`
  );

  const claims = useMemo(() => {
    const list = q.data?.refunds || [];
    const s = search.trim().toLowerCase();
    if (!s) return list;
    return list.filter((c) =>
      [orderNo(c), customerName(c), vendorName(c), c.reason || c.description || ""].some((v) =>
        v.toLowerCase().includes(s)
      )
    );
  }, [q.data, search]);

  const summary = q.data?.summary;
  const counts: Partial<Record<Stage, number>> = summary
    ? {
        ALL: summary.total,
        VENDOR_REVIEW: summary.pending,
        FORWARDED_TO_FINANCE: summary.approved,
        COMPLETED: summary.completed,
        REJECTED: summary.rejected,
      }
    : {};

  const done = (m: string, updatedRefund?: RefundClaim) => {
    setOpen(null);
    setNotice(m);
    setToast({ message: m, type: "success" });

    // Optimistically update the claim in local state so the UI reacts immediately
    if (updatedRefund && updatedRefund._id) {
      q.setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          refunds: prev.refunds.map((r) => (r._id === updatedRefund._id ? { ...r, ...updatedRefund } : r)),
        };
      });
    }

    // Refresh queue from server
    q.reload();
  };

  return (
    <>
      <PageHeader title="Returns & Refunds" subtitle="Manage return requests & refund status" />

      {/* Floating high-visibility Toast */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-[70] max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20"
              : "bg-red-600 text-white border-red-500 shadow-red-900/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-white" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">
              {toast.type === "success" ? "Success" : "Error"}
            </p>
            <p className="text-sm font-semibold leading-snug">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {/* Primary tabs: vendor (COD) vs my (online) refund requests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            {
              key: "vendor",
              title: "Vendor Refund Requests",
              sub: "COD • Store direct payouts",
              icon: Store,
              count: summary?.vendorCount,
              on: "border-sky-600 bg-sky-50/70 shadow-sm",
              iconOn: "bg-sky-600",
            },
            {
              key: "my",
              title: "My Refund Requests",
              sub: "Online • Super admin payouts",
              icon: CreditCard,
              count: summary?.myCount,
              on: "border-indigo-600 bg-indigo-50/70 shadow-sm",
              iconOn: "bg-indigo-600",
            },
          ] as const).map((t) => {
            const sel = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={sel}
                onClick={() => {
                  setType(t.key);
                  setPage(1);
                  setNotice(null);
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                  sel ? t.on : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    sel ? `${t.iconOn} text-white` : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-extrabold text-slate-900">{t.title}</span>
                  <span className="block text-[11px] text-slate-500">{t.sub}</span>
                </span>
                {t.count != null && (
                  <span className="min-w-7 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 text-center shadow-xs">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <select
            className={`${field} lg:w-64`}
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by store"
          >
            <option value="">All stores</option>
            {(vendors.data?.data || []).map((v) => (
              <option key={v._id} value={v._id}>
                {v.businessDetails?.businessName || "Store"}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className={`${field} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, store, customer…"
              aria-label="Search refund requests"
            />
          </div>
          <button
            type="button"
            onClick={() => q.reload()}
            disabled={q.loading}
            className={`${btn.outline} h-11 px-4 shrink-0 flex items-center gap-2`}
            title="Refresh returns and refunds"
          >
            <RefreshCw className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        <Tabs
          tabs={STAGES}
          active={stage}
          onChange={(k) => {
            setStage(k);
            setPage(1);
            setNotice(null);
          }}
          counts={counts}
        />

        {notice && <SuccessBanner message={notice} />}
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}

        {q.data && (
          <p className="text-xs text-slate-500 font-medium">
            Showing {claims.length} of {q.data.total} {type === "vendor" ? "vendor direct refund" : "online refund"}{" "}
            requests
          </p>
        )}

        {q.loading && !q.data ? (
          <LoadingBlock text="Loading return & refund requests…" />
        ) : !claims.length ? (
          <div className="bg-white rounded-2xl border border-slate-100">
            <EmptyState
              icon={RotateCcw}
              title="No return requests found"
              text="Nothing matches these filters right now."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {claims.map((c) => (
              <ClaimCard
                key={c._id}
                c={c}
                onOpen={(kind) => {
                  setNotice(null);
                  setOpen({ kind, claim: c });
                }}
              />
            ))}
          </div>
        )}

        {(q.data?.pages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={btn.outline}
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-slate-600">
              Page {page} of {q.data?.pages}
            </span>
            <button
              type="button"
              disabled={page >= (q.data?.pages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className={btn.outline}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {open?.kind === "EXAMINE" && (
        <ExamineModal claim={open.claim} onClose={() => setOpen(null)} onDone={done} />
      )}
      {open?.kind === "PICKUP" && (
        <PickupModal claim={open.claim} onClose={() => setOpen(null)} onDone={done} />
      )}
      {open?.kind === "INSPECTION" && (
        <InspectionModal claim={open.claim} onClose={() => setOpen(null)} onDone={done} />
      )}
      {open?.kind === "FINALIZE" && (
        <FinalizeModal claim={open.claim} onClose={() => setOpen(null)} onDone={done} />
      )}
      {open?.kind === "AUDIT" && <AuditModal claim={open.claim} onClose={() => setOpen(null)} />}
    </>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => undefined);
      }}
      className="p-1 rounded text-sky-600 hover:bg-sky-50 cursor-pointer"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function PayoutDetails({ c }: { c: RefundClaim }) {
  const p = c.customerPayoutDetails || {};
  const cod = isCod(c);
  const holder = p.accountHolderName || customerName(c);
  const phone = c.customer?.phone || c.order?.shippingAddress?.phone || "";
  const hasBank = Boolean(p.accountNumber || p.bankName || p.upiId);
  const rows: Array<[string, string, boolean]> = [
    ["Account holder", holder, false],
    ["Customer phone", phone, true],
    ["Bank name", p.bankName || "", false],
    ["Account number", p.accountNumber || "", true],
    ["IFSC / Branch code", p.ifscCode || "", true],
    ["UPI / Wallet ID", p.upiId || "", true],
  ];
  return (
    <div
      className={`rounded-xl border p-3 ${
        cod ? "border-amber-200 bg-amber-50/40" : "border-sky-200 bg-sky-50/40"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {cod ? <Banknote className="w-4 h-4 text-amber-600" /> : <CreditCard className="w-4 h-4 text-sky-600" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-slate-900">
            {cod ? "Vendor COD Payout Info" : "Customer Bank Details (To Pay Back)"}
          </p>
          <p className="text-[10px] text-slate-500">
            {cod ? "Vendor disburses directly" : "Super admin platform refund destination"}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            cod ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"
          }`}
        >
          {p.method ? p.method.replace(/_/g, " ") : cod ? "COD CASH" : "ONLINE GATEWAY"}
        </span>
      </div>
      <p className="text-xs text-slate-600">
        Amount to disburse: <span className="font-extrabold text-slate-900">{npr(amountOf(c))}</span>
      </p>
      <dl className="mt-1.5 space-y-1">
        {rows
          .filter(([, v]) => v)
          .map(([k, v, copy]) => (
            <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
              <dt className="text-slate-500">{k}</dt>
              <dd className="flex items-center gap-1 font-semibold text-slate-800 min-w-0">
                <span className="truncate select-all">{v}</span>
                {copy && <CopyButton value={v} label={k} />}
              </dd>
            </div>
          ))}
      </dl>
      {!hasBank && !cod && (
        <p className="mt-2 text-[11px] text-sky-700">
          No secondary bank entered. Payout defaults to original payment gateway reversal ({payMethod(c)}).
        </p>
      )}
      {p.payoutReference && (
        <p className="mt-2 text-[11px] text-emerald-700 font-semibold">
          Paid · Ref {p.payoutReference}
          {p.payoutCompletedAt ? ` · ${formatDateTime(p.payoutCompletedAt)}` : ""}
        </p>
      )}
    </div>
  );
}

function Stepper({ c }: { c: RefundClaim }) {
  const store = c.vendorReview?.decision || "PENDING";
  const staffDone = Boolean(c.staffReview?.isExamined || c.staffReview?.notes);
  const staffText = staffDone
    ? c.staffReview?.forwardedToFinance
      ? "Sent to Finance"
      : c.staffReview?.decision || "Reviewed"
    : "Pending";
  const insp = c.inspection?.result;
  const hasInsp = Boolean(c.inspection?.required || insp === "PASSED" || insp === "FAILED" || c.inspection?.notes);
  const completed = c.status === "COMPLETED";
  const rejected = isRejectedStatus(c.status);
  const steps: Array<{ title: string; text: string; tone: "done" | "bad" | "active" | "idle" }> = [
    { title: "Store", text: store, tone: store === "ACCEPTED" ? "done" : store === "REJECTED" ? "bad" : "idle" },
    { title: "Staff", text: staffText, tone: staffDone ? "done" : "idle" },
    {
      title: "Item Check",
      text: hasInsp ? (insp === "PASSED" ? "Passed" : insp === "FAILED" ? "Failed" : "Pending") : "Skipped",
      tone: insp === "PASSED" ? "done" : insp === "FAILED" ? "bad" : hasInsp ? "active" : "idle",
    },
    {
      title: "Refund",
      text: completed ? "Sent" : rejected ? "Rejected" : "Pending",
      tone: completed ? "done" : rejected ? "bad" : "idle",
    },
  ];
  const dot = {
    done: "bg-emerald-500 text-white",
    bad: "bg-red-500 text-white",
    active: "bg-sky-600 text-white",
    idle: "bg-slate-200 text-slate-500",
  };
  return (
    <ol className="flex items-start" aria-label="Workflow progress">
      {steps.map((s, i) => (
        <li key={s.title} className="flex-1 flex flex-col items-center text-center relative">
          {i > 0 && <span className="absolute top-3 right-1/2 w-full h-0.5 bg-slate-200 -z-0" aria-hidden />}
          <span
            className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${dot[s.tone]}`}
          >
            {s.tone === "done" ? (
              <Check className="w-3.5 h-3.5" />
            ) : s.tone === "bad" ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              i + 1
            )}
          </span>
          <span className="mt-1 text-[11px] font-bold text-slate-800">{s.title}</span>
          <span className="text-[10px] text-slate-500 leading-tight">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

function ClaimCard({ c, onOpen }: { c: RefundClaim; onOpen: (k: ModalKind) => void }) {
  const cod = isCod(c);
  const photos = photosOf(c);
  const completed = c.status === "COMPLETED";
  const rejected = isRejectedStatus(c.status);
  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900">Order #{orderNo(c)}</p>
          {c.refundNumber && <p className="text-[10px] font-mono text-slate-400 font-semibold">{c.refundNumber}</p>}
          <p className="text-xs text-slate-600 truncate mt-0.5">
            <Store className="w-3 h-3 inline text-emerald-600 mr-1" />
            <span className="font-bold text-slate-800">{vendorName(c)}</span> · {customerName(c)}
          </p>
        </div>
        <Pill badge={statusBadge(c.status)} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 pt-1 border-t border-slate-100">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {cod ? "Vendor refund amount" : "Online refund amount"}
          </p>
          <p className="text-lg font-extrabold text-slate-900">{npr(amountOf(c))}</p>
        </div>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
            {payMethod(c)}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
            {c.claimType || "RETURN"}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Return reason</p>
        <p className="text-xs text-slate-700 mt-0.5">{c.reason || c.description || "Customer requested return"}</p>
      </div>

      <PayoutDetails c={c} />

      {photos.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-600 mb-1.5">Item photos ({photos.length})</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Item photo ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <Stepper c={c} />

      {(c.vendorReview?.notes || c.staffReview?.notes || c.inspection?.notes) && (
        <div className="space-y-0.5 text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5">
          {c.vendorReview?.notes && (
            <p>
              <span className="font-bold text-slate-700">Store:</span> “{c.vendorReview.notes}”
            </p>
          )}
          {c.staffReview?.notes && (
            <p>
              <span className="font-bold text-slate-700">Staff:</span> “{c.staffReview.notes}”
            </p>
          )}
          {c.inspection?.notes && (
            <p>
              <span className="font-bold text-slate-700">Inspection:</span> “{c.inspection.notes}”
            </p>
          )}
        </div>
      )}

      {completed ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-2.5">
          <p className="text-xs font-bold text-emerald-800">Refund of {npr(amountOf(c))} disbursed</p>
          <button
            type="button"
            onClick={() => onOpen("AUDIT")}
            className={`${btn.ghost} h-8 text-xs font-bold text-emerald-700`}
          >
            <FileText className="w-3.5 h-3.5" /> Details
          </button>
        </div>
      ) : rejected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200/60 px-3 py-2.5">
          <p className="text-xs font-bold text-red-800">Return request closed / rejected</p>
          <button
            type="button"
            onClick={() => onOpen("AUDIT")}
            className={`${btn.ghost} h-8 text-xs font-bold text-red-700`}
          >
            <FileText className="w-3.5 h-3.5" /> Details
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 [&>button]:whitespace-nowrap [&>button]:px-2">
          <button
            type="button"
            onClick={() => onOpen("EXAMINE")}
            className="h-9 px-3 rounded-xl border border-sky-600 text-sky-700 bg-sky-50/50 hover:bg-sky-100/70 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 shrink-0 text-sky-600" /> Review
          </button>
          <button
            type="button"
            onClick={() => onOpen("PICKUP")}
            className="h-9 px-3 rounded-xl border border-indigo-600 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Truck className="w-4 h-4 shrink-0 text-indigo-600" /> Assign Pickup
          </button>
          <button
            type="button"
            onClick={() => onOpen("INSPECTION")}
            className="h-9 px-3 rounded-xl border border-amber-600 text-amber-700 bg-amber-50/50 hover:bg-amber-100/70 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Search className="w-4 h-4 shrink-0 text-amber-600" /> Check Item
          </button>
          <button
            type="button"
            onClick={() => onOpen("FINALIZE")}
            className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Banknote className="w-4 h-4 shrink-0 text-white" />{" "}
            {cod ? "Audit Store Pay" : "Pay Online Refund"}
          </button>
          <button
            type="button"
            onClick={() => onOpen("AUDIT")}
            className={`${btn.ghost} h-8 col-span-2 text-xs font-bold text-slate-600`}
          >
            <FileText className="w-3.5 h-3.5" /> View details & audit history
          </button>
        </div>
      )}
    </article>
  );
}

/* ─── Modals ─────────────────────────────────────────────────────────── */

function useSubmit(onDone: (m: string, refund?: RefundClaim) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<{ message: string; refund?: RefundClaim }>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      onDone(res.message, res.refund);
    } catch (e: unknown) {
      console.error("[Refund action failed]", e);
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, setError, run };
}

function Choice<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<{ key: K; label: string; desc?: string; cls: string }>;
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          className={`px-3.5 py-2.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
            value === o.key ? o.cls : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          <span className="block text-sm font-bold">{o.label}</span>
          {o.desc && <span className="block text-[11px] opacity-80 mt-0.5">{o.desc}</span>}
        </button>
      ))}
    </div>
  );
}

const ModalTitle = ({ title, c }: { title: string; c: RefundClaim }) => (
  <span>
    {title}
    <span className="block text-xs font-semibold text-slate-500 mt-0.5">Order #{orderNo(c)}</span>
  </span>
);

const EXAMINE_OPTIONS = [
  {
    key: "SCHEDULE_PICKUP",
    label: "Need Return Pickup",
    desc: "Assign a delivery boy to collect item from customer",
    cls: "border-sky-600 bg-sky-50 text-sky-900",
  },
  {
    key: "FORWARD_TO_FINANCE",
    label: "Send Directly for Refund",
    desc: "No pickup needed — forward directly for payout authorization",
    cls: "border-emerald-600 bg-emerald-50 text-emerald-900",
  },
  {
    key: "REJECT",
    label: "Reject Return",
    desc: "Customer request does not meet return policy",
    cls: "border-red-600 bg-red-50 text-red-900",
  },
] as const;
const CONDITIONS = ["Good", "Used / Opened", "Defective / Damaged"] as const;

function ExamineModal({
  claim,
  onClose,
  onDone,
}: {
  claim: RefundClaim;
  onClose: () => void;
  onDone: (m: string, refund?: RefundClaim) => void;
}) {
  const [action, setAction] = useState<(typeof EXAMINE_OPTIONS)[number]["key"]>(
    claim.pickup?.required ? "SCHEDULE_PICKUP" : "FORWARD_TO_FINANCE"
  );
  const [condition, setCondition] = useState<string>("Good");
  const [deduction, setDeduction] = useState("0");
  const [notes, setNotes] = useState(claim.staffReview?.notes || "");
  const s = useSubmit(onDone);

  const save = () => {
    if (action === "REJECT" && !notes.trim()) {
      return s.setError("Please explain why this return is being rejected.");
    }
    const full = [
      notes.trim(),
      `Condition: ${condition}`,
      Number(deduction) > 0 ? `Deduction: ${Number(deduction)}%` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    s.run(async () => {
      const r = await api.examineRefund(claim._id, {
        action,
        notes: full,
        rejectionReason: action === "REJECT" ? notes.trim() : undefined,
      });
      return {
        message: r.message || "Staff review saved successfully.",
        refund: r.refund || r.data,
      };
    });
  };

  return (
    <Modal
      open
      wide
      title={<ModalTitle title="Staff Return Review" c={claim} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={s.busy}
            onClick={save}
            className={`min-w-28 flex items-center justify-center gap-1.5 ${
              action === "REJECT" ? btn.danger : btn.primary
            }`}
          >
            {s.busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save Review"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Prominent in-modal error notice */}
        {s.error && <ErrorBanner message={s.error} />}

        <div>
          <p className={fieldLabel}>Staff decision</p>
          <Choice options={EXAMINE_OPTIONS} value={action} onChange={setAction} label="Staff decision" />
        </div>
        <div>
          <p className={fieldLabel}>Item condition</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((cnd) => (
              <button
                key={cnd}
                type="button"
                aria-pressed={condition === cnd}
                onClick={() => setCondition(cnd)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                  condition === cnd ? "bg-sky-600 border-sky-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cnd}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className={fieldLabel}>Deduction % (0 for full refund)</span>
          <input
            type="number"
            min={0}
            max={100}
            className={field}
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Staff review notes {action === "REJECT" && "*"}</span>
          <textarea
            className={`${field} h-24 py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Explain reason for decision, package condition, or customer details…"
          />
        </label>
      </div>
    </Modal>
  );
}

// Pickup status values match the Refund model's pickup.status enum.
const PICKUP_STATUSES = [
  { key: "ASSIGNED", label: "Pickup Scheduled / Assigned", cls: "border-sky-600 bg-sky-50 text-sky-900" },
  { key: "PICKED_UP", label: "Picked Up from Customer", cls: "border-indigo-600 bg-indigo-50 text-indigo-900" },
  { key: "RECEIVED_AT_VENDOR", label: "Delivered to Store / Warehouse", cls: "border-emerald-600 bg-emerald-50 text-emerald-900" },
] as const;

function PickupModal({
  claim,
  onClose,
  onDone,
}: {
  claim: RefundClaim;
  onClose: () => void;
  onDone: (m: string, refund?: RefundClaim) => void;
}) {
  const current = riderOf(claim);
  const riders = useAsync(() => api.getRiders(), "riders");
  const [riderId, setRiderId] = useState("");
  const [status, setStatus] = useState<(typeof PICKUP_STATUSES)[number]["key"]>(
    (PICKUP_STATUSES.find((p) => p.key === claim.pickup?.status)?.key) || "ASSIGNED"
  );
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState(claim.pickup?.notes || "");
  const s = useSubmit(onDone);

  const save = () =>
    s.run(async () => {
      const full = [notes.trim(), tracking.trim() ? `Tracking: ${tracking.trim()}` : ""].filter(Boolean).join(" · ");
      if (riderId) {
        const r = await api.assignRefundPickup(claim._id, {
          deliveryBoyId: riderId,
          notes: full,
          trackingNumber: tracking.trim() || undefined,
        });
        const otpText = r.pickupOtp ? ` Customer verification OTP: ${r.pickupOtp}` : "";
        return {
          message: r.message || `Return pickup assigned successfully.${otpText}`,
          refund: r.refund || r.data,
        };
      }
      const r = await api.updateRefundPickup(claim._id, {
        pickupStatus: status,
        notes: full,
        trackingNumber: tracking.trim() || undefined,
      });
      return {
        message: r.message || "Return pickup updated successfully.",
        refund: r.refund || r.data,
      };
    });

  return (
    <Modal
      open
      wide
      title={<ModalTitle title="Schedule Return Pickup" c={claim} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={s.busy}
            onClick={save}
            className={`min-w-28 flex items-center justify-center gap-1.5 ${btn.primary}`}
          >
            {s.busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : riderId ? (
              "Assign Rider"
            ) : (
              "Update Pickup"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Prominent in-modal error notice */}
        {s.error && <ErrorBanner message={s.error} />}

        <p className="text-xs text-slate-500">
          Assign a rider to collect the returned package
          {current ? ` — currently ${current.fullName || "assigned"}${current.phone ? ` (${current.phone})` : ""}` : ""}
          .
        </p>

        {claim.pickup?.otp && (
          <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Customer Pickup OTP</p>
              <p className="text-lg font-mono font-extrabold text-sky-900">{claim.pickup.otp}</p>
            </div>
            <CopyButton value={claim.pickup.otp} label="Pickup OTP" />
          </div>
        )}

        <label className="block">
          <span className={fieldLabel}>Select delivery partner</span>
          <select
            className={field}
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            disabled={riders.loading}
          >
            <option value="">{riders.loading ? "Loading riders…" : "— Keep current / update status only —"}</option>
            {(riders.data || []).map((r) => (
              <option key={r._id} value={r._id}>
                {r.fullName || r.name} · {r.phone}
                {r.isOnline ? " · online" : ""}
              </option>
            ))}
          </select>
          {riders.error && <span className="text-[11px] text-red-600 mt-1 block">{riders.error}</span>}
        </label>

        {!riderId && (
          <div>
            <p className={fieldLabel}>Pickup status</p>
            <Choice options={PICKUP_STATUSES} value={status} onChange={setStatus} label="Pickup status" />
          </div>
        )}

        <label className="block">
          <span className={fieldLabel}>Tracking number (optional)</span>
          <input
            className={field}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g., BM-REV-987654"
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Pickup notes</span>
          <textarea
            className={`${field} h-20 py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for delivery boy or package details…"
          />
        </label>
      </div>
    </Modal>
  );
}

const GRADES = [
  { key: "A", label: "New / Resellable (Grade A)" },
  { key: "B", label: "Minor Wear (Grade B)" },
  { key: "C", label: "Used / Heavy Wear (Grade C)" },
  { key: "DAMAGED", label: "Damaged or Broken" },
  { key: "WRONG_ITEM", label: "Wrong Item Received" },
] as const;
const RESULT_OPTIONS = [
  { key: "PASSED", label: "Item Accepted (Good)", cls: "border-emerald-600 bg-emerald-50 text-emerald-900" },
  { key: "FAILED", label: "Item Rejected (Damaged)", cls: "border-red-600 bg-red-50 text-red-900" },
] as const;

function InspectionModal({
  claim,
  onClose,
  onDone,
}: {
  claim: RefundClaim;
  onClose: () => void;
  onDone: (m: string, refund?: RefundClaim) => void;
}) {
  const [result, setResult] = useState<"PASSED" | "FAILED">(
    claim.inspection?.result === "FAILED" ? "FAILED" : "PASSED"
  );
  const [grade, setGrade] = useState<string>("A");
  const [deduction, setDeduction] = useState("0");
  const [notes, setNotes] = useState(claim.inspection?.notes || "");
  const s = useSubmit(onDone);

  const save = () =>
    s.run(async () => {
      const g = GRADES.find((x) => x.key === grade)?.label || grade;
      const full = [notes.trim(), `Grade: ${g}`, Number(deduction) > 0 ? `Deduction: ${Number(deduction)}%` : ""]
        .filter(Boolean)
        .join(" · ");
      const r = await api.recordRefundInspection(claim._id, { result, notes: full });
      return {
        message: r.message || "Item inspection saved successfully.",
        refund: r.refund || r.data,
      };
    });

  return (
    <Modal
      open
      wide
      title={<ModalTitle title="Check Returned Item" c={claim} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={s.busy}
            onClick={save}
            className={`min-w-28 flex items-center justify-center gap-1.5 ${
              result === "FAILED" ? btn.danger : btn.success
            }`}
          >
            {s.busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save Inspection"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Prominent in-modal error notice */}
        {s.error && <ErrorBanner message={s.error} />}

        <p className="text-xs text-slate-500">Inspect physical condition & verify contents.</p>
        <div>
          <p className={fieldLabel}>Item check result</p>
          <Choice options={RESULT_OPTIONS} value={result} onChange={setResult} label="Item check result" />
        </div>
        <label className="block">
          <span className={fieldLabel}>Item condition</span>
          <select className={field} value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={fieldLabel}>Deduction % (if any)</span>
          <input
            type="number"
            min={0}
            max={100}
            className={field}
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Inspection remarks</span>
          <textarea
            className={`${field} h-20 py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details about packaging, seals, or missing parts…"
          />
        </label>
      </div>
    </Modal>
  );
}

const FINALIZE_OPTIONS = [
  { key: "approve", label: "Disburse / Finalize Refund", cls: "border-emerald-600 bg-emerald-50 text-emerald-900" },
  { key: "reject", label: "Reject Refund", cls: "border-red-600 bg-red-50 text-red-900" },
] as const;

function FinalizeModal({
  claim,
  onClose,
  onDone,
}: {
  claim: RefundClaim;
  onClose: () => void;
  onDone: (m: string, refund?: RefundClaim) => void;
}) {
  const online = !isCod(claim);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [ref, setRef] = useState("");
  const s = useSubmit(onDone);

  const save = () => {
    if (decision === "reject" && !ref.trim()) {
      return s.setError("Please give a reason for rejecting this refund.");
    }
    s.run(async () => {
      if (decision === "reject") {
        const r = await api.examineRefund(claim._id, {
          action: "REJECT",
          notes: ref.trim(),
          rejectionReason: ref.trim(),
        });
        return {
          message: r.message || "Refund rejected.",
          refund: r.refund || r.data,
        };
      }
      if (online) {
        const r = await api.processOnlineRefund(claim._id, {
          payoutReference: ref.trim() || `ONL-PAY-${Date.now()}`,
          notes: ref.trim() || "Online refund processed by Super Admin.",
        });
        return {
          message: r.message || "Online refund disbursed to customer. Platform commission preserved.",
          refund: r.refund || r.data,
        };
      }
      const r = await api.finalizeRefundPayout(claim._id, {
        payoutReference: ref.trim() || `COD-PAY-${Date.now()}`,
        notes: ref.trim() || "COD refund payout finalized by Super Admin.",
      });
      return {
        message: r.message || "Refund sent to customer successfully.",
        refund: r.refund || r.data,
      };
    });
  };

  return (
    <Modal
      open
      wide
      title={<ModalTitle title={online ? "Execute Online Payment Refund" : "Audit & Finalize Store Payout"} c={claim} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={s.busy}
            onClick={save}
            className={`min-w-28 flex items-center justify-center gap-1.5 ${
              decision === "reject" ? btn.danger : btn.success
            }`}
          >
            {s.busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing…
              </>
            ) : decision === "reject" ? (
              "Reject Refund"
            ) : (
              "Confirm Payout"
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Prominent in-modal error notice */}
        {s.error && <ErrorBanner message={s.error} />}

        <p className="text-xs text-slate-600 rounded-xl bg-slate-50 p-3 leading-relaxed">
          Approving will immediately record <span className="font-extrabold text-slate-900">{npr(amountOf(claim))}</span>{" "}
          back to the customer&apos;s account ({payMethod(claim)}). Platform commission (1.5%) is preserved.
        </p>

        <PayoutDetails c={claim} />

        <div>
          <p className={fieldLabel}>Refund decision</p>
          <Choice options={FINALIZE_OPTIONS} value={decision} onChange={setDecision} label="Refund decision" />
        </div>

        <label className="block">
          <span className={fieldLabel}>
            {decision === "reject"
              ? "Rejection reason *"
              : online
              ? "Payment UTR / gateway reference"
              : "Store disbursement / bank transaction reference (optional)"}
          </span>
          <input
            className={field}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder={
              decision === "reject"
                ? "Why is this refund being rejected?"
                : "e.g. ESEWA-TXN-987654 or bank UTR reference…"
            }
          />
        </label>
      </div>
    </Modal>
  );
}

function AuditModal({ claim, onClose }: { claim: RefundClaim; onClose: () => void }) {
  const facts: Array<[string, string]> = [
    ["Customer", customerName(claim)],
    ["Store", vendorName(claim)],
    ["Amount & method", `${npr(amountOf(claim))} (${payMethod(claim)})`],
    ["Payout responsibility", claim.isVendorFunded ? "Vendor direct settlement (COD)" : "Super admin online gateway payout"],
    ["Return reason", claim.reason || "Product return requested"],
    ["Requested", formatDateTime(claim.createdAt)],
  ];
  return (
    <Modal open wide title={<ModalTitle title="Request Details & Audit" c={claim} />} onClose={onClose}>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {facts.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
            <dd className="text-sm font-semibold text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
      {!!claim.timeline?.length && (
        <div className="mt-5">
          <p className="text-xs font-extrabold text-slate-900 mb-2">Lifecycle audit history</p>
          <ol className="relative border-l-2 border-slate-200 ml-1.5 space-y-3">
            {claim.timeline.map((t, i) => (
              <li key={i} className="pl-4 relative">
                <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-sky-600" aria-hidden />
                <p className="text-xs font-bold text-slate-800">{t.status}</p>
                <p className="text-[11px] text-slate-500">
                  {t.actorName ? `${t.actorName} · ` : ""}
                  {t.actorRole || "system"}
                  {t.timestamp ? ` · ${formatDateTime(t.timestamp)}` : ""}
                </p>
                {t.notes && <p className="text-[11px] text-slate-600 italic">“{t.notes}”</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}
