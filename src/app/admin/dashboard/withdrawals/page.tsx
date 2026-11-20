"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Banknote, ClipboardCheck, Plus } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminWithdrawal } from "@/lib/admin/types";
import { formatDateTime, npr, txnStatusBadge } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, Pill, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";
import { useConsole } from "@/lib/admin/console";
import { CreateWithdrawalModal } from "@/components/admin/WithdrawalModals";

// app: Screens/adminScreens/withdrawals.tsx
const STATUSES = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
] as const;

const ACTIONS = [
  { key: "FORWARD_TO_FINANCE", label: "Forward to Finance", cls: "border-violet-300 bg-violet-50 text-violet-800" },
  { key: "REQUEST_INFO", label: "Needs Clarification", cls: "border-amber-300 bg-amber-50 text-amber-800" },
  { key: "REJECT", label: "Reject Request", cls: "border-red-300 bg-red-50 text-red-800" },
] as const;
type Action = (typeof ACTIONS)[number]["key"];

export default function WithdrawalRequestsPage() {
  const { staff } = useConsole();
  const vendors = useAsync(() => api.getStoreOptions(), "wq-vendors");
  const [vendorId, setVendorId] = useState("all");
  const [status, setStatus] = useState<(typeof STATUSES)[number]["key"]>("all");
  const [page, setPage] = useState(1);
  const [examining, setExamining] = useState<AdminWithdrawal | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const q = useAsync(
    () => api.getWithdrawalQueue({ vendorId: vendorId === "all" ? undefined : vendorId, status: status === "all" ? undefined : status, page, limit: 10 }),
    `${vendorId}|${status}|${page}`
  );

  return (
    <>
      <PageHeader
        title="Withdrawal Requests"
        subtitle={`${q.data?.total ?? 0} vendor payout requests to examine`}
        actions={
          staff ? undefined : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={`${btn.primary} bg-emerald-600 hover:bg-emerald-700`}
              >
                <Plus className="w-4 h-4" /> Create Withdrawal
              </button>
              <Link href="/admin/dashboard/finance" className={btn.outline}>
                <Banknote className="w-4 h-4" /> Approve payouts in Ledger
              </Link>
            </div>
          )
        }
      />
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          <Tabs tabs={STATUSES} active={status} onChange={(k) => { setStatus(k); setPage(1); }} />
          <select className={`${field} md:w-64`} value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPage(1); }} aria-label="Filter by store">
            <option value="all">All stores</option>
            {(vendors.data?.data || []).map((v) => <option key={v._id} value={v._id}>{v.businessDetails?.businessName || "Store"}</option>)}
          </select>
        </div>
        {notice && <SuccessBanner message={notice} />}
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        <Card>
          {q.loading && !q.data ? (
            <LoadingBlock text="Loading requests…" />
          ) : !q.data?.withdrawals.length ? (
            <EmptyState icon={Banknote} title="No withdrawal requests" />
          ) : (
            <div className="divide-y divide-slate-100">
              {q.data.withdrawals.map((w) => {
                const v = typeof w.vendor === "object" ? w.vendor : null;
                return (
                  <div key={w._id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">{v?.businessDetails?.businessName || "Store"}</span>
                        <Pill badge={txnStatusBadge(w.status)} />
                        {w.escalationStatus && <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">{w.escalationStatus.replace(/_/g, " ")}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDateTime(w.createdAt)} · Wallet {npr(v?.wallet?.currentBalance)}
                        {w.reviewedBy?.name ? ` · Reviewed by ${w.reviewedBy.name}` : ""}
                      </p>
                      {(w.internalNotes || w.rejectionReason) && <p className="text-xs text-slate-600 mt-1">{w.rejectionReason ? `Rejected: ${w.rejectionReason}` : `Notes: ${w.internalNotes}`}</p>}
                    </div>
                    <p className="text-lg font-extrabold">{npr(Math.abs(w.amount))}</p>
                    {!["REJECTED", "COMPLETED", "SETTLED"].includes(w.status) && (
                      <button type="button" onClick={() => setExamining(w)} className={`${btn.primary} h-9`}><ClipboardCheck className="w-4 h-4" /> Examine</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        {(q.data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline}>Previous</button>
            <span className="text-sm text-slate-600">Page {page} of {q.data?.totalPages}</span>
            <button type="button" disabled={page >= (q.data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline}>Next</button>
          </div>
        )}
      </div>
      {examining && (
        <ExamineModal
          w={examining}
          staff={staff}
          onClose={() => setExamining(null)}
          onDone={(m) => {
            setExamining(null);
            setNotice(m);
            q.reload();
          }}
        />
      )}
      {creating && (
        <CreateWithdrawalModal
          onClose={() => setCreating(false)}
          onDone={(m) => {
            setCreating(false);
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

function ExamineModal({ w, staff, onClose, onDone }: { w: AdminWithdrawal; staff: boolean; onClose: () => void; onDone: (m: string) => void }) {
  // Backend (examineVendorWithdrawal) only lets the super admin reject; staff admins forward or ask for info (same as the app)
  const actions = staff ? ACTIONS.filter((a) => a.key !== "REJECT") : ACTIONS;
  const [notes, setNotes] = useState(w.internalNotes || "");
  const [action, setAction] = useState<Action>(w.escalationStatus === "INFO_REQUESTED" ? "REQUEST_INFO" : "FORWARD_TO_FINANCE");
  const [reason, setReason] = useState(w.rejectionReason || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (action === "REJECT" && !reason.trim()) return setError("Please provide a reason for rejecting this withdrawal.");
    setBusy(true);
    setError(null);
    try {
      await api.examineWithdrawal(w._id, { internalNotes: notes.trim(), escalationAction: action, rejectionReason: reason.trim() || undefined });
      onDone(action === "REJECT" ? "Withdrawal has been rejected and the reason is recorded." : "Withdrawal examination and escalation saved successfully.");
    } catch (e) {
      setError(api.errorText(e, "Failed to update withdrawal"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`Examine payout · ${npr(Math.abs(w.amount))}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
          <button type="button" disabled={busy} onClick={save} className={action === "REJECT" ? btn.danger : btn.primary}>{busy ? "Saving…" : "Save Examination"}</button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Escalation">
          {actions.map((a) => (
            <button key={a.key} type="button" role="radio" aria-checked={action === a.key} onClick={() => setAction(a.key)} className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold text-left cursor-pointer ${action === a.key ? a.cls : "border-slate-200 text-slate-600"}`}>
              {a.label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className={fieldLabel}>Internal notes</span>
          <textarea className={`${field} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {action === "REJECT" && (
          <label className="block">
            <span className={fieldLabel}>Rejection reason *</span>
            <textarea className={`${field} h-20 py-2`} value={reason} onChange={(e) => setReason(e.target.value)} />
            <span className="text-[11px] text-slate-500">The amount is returned to the vendor&apos;s wallet.</span>
          </label>
        )}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
