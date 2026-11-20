"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Landmark, Plus, RefreshCw, Search, Wallet } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminWithdrawal, LedgerTxn } from "@/lib/admin/types";
import { formatDateTime, npr, txnStatusBadge, TXN_LABELS } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, Pill, StatCard, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";
import { CreateWithdrawalModal, ReviewWithdrawalModal } from "@/components/admin/WithdrawalModals";

const MAIN = [
  { key: "withdrawals", label: "Withdrawal Approvals" },
  { key: "ledger", label: "Platform Ledger" },
] as const;

const W_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending Approval" },
  { key: "SETTLED", label: "Settled" },
  { key: "REJECTED", label: "Declined" },
] as const;
const wGroup = (s: string) =>
  ["PENDING", "SUBMITTED"].includes(s) ? "PENDING" : ["SETTLED", "COMPLETED"].includes(s) ? "SETTLED" : ["REJECTED", "FAILED", "DECLINED", "REVERSED"].includes(s) ? "REJECTED" : "OTHER";

// app: finance.tsx ledger chips
const L_FILTERS = [
  { key: "ALL", label: "All Transactions" },
  { key: "COD_FLOW", label: "Cash on Delivery Flow (0% Fee)" },
  { key: "ORDER_EARNING", label: "Product Sale Credits" },
  { key: "REFUNDS", label: "Refunds & Reversals" },
  { key: "WITHDRAWALS", label: "Bank Payouts" },
] as const;
const L_TYPES: Record<string, string[]> = {
  COD_FLOW: ["COD_COLLECTION", "COD_HANDOVER"],
  ORDER_EARNING: ["ORDER_EARNING", "DIRECT_QR_PAYMENT", "PLATFORM_FEE", "COMMISSION_DEDUCTION"],
  REFUNDS: ["REFUND_DEDUCTION", "COMMISSION_REVERSAL", "RECOVERY_ADJUSTMENT", "VENDOR_DIRECT_REFUND", "RETURN_PICKUP_CHARGE"],
  WITHDRAWALS: ["WITHDRAWAL", "WITHDRAWAL_REQUEST", "WITHDRAWAL_PAYOUT"],
};

const vendorName = (v: AdminWithdrawal["vendor"] | LedgerTxn["vendor"]) => (v && typeof v === "object" ? v.businessDetails?.businessName || v.sellerDetails?.sellerName || "Store" : "Store");

/** app: AdminMain/finance.tsx — superadmin settlement terminal */
export default function FinancePage() {
  const [tab, setTab] = useState<(typeof MAIN)[number]["key"]>("withdrawals");
  const stats = useAsync(() => api.getDashboardStats(), "fin-stats");
  const fin = stats.data?.kpi.finances;
  return (
    <>
      <PageHeader title="Financial Ledger (1.5%)" subtitle="Platform commission, vendor payouts and every wallet movement." />
      <div className="space-y-4">
        {fin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Net Commission" value={npr(fin.netCommissionEarned)} sub={`${(fin.commissionRate * 100).toFixed(1)}% of ${npr(fin.grossTransactions)}`} icon={Wallet} tone="green" />
            <StatCard label="Vendor Wallets" value={npr(fin.vendorWalletBalances)} tone="violet" />
            <StatCard label="Pending Settlements" value={npr(fin.vendorPendingSettlements)} sub={`${fin.pendingWithdrawalsCount} request(s)`} tone="amber" />
            <StatCard label="Withdrawals Paid" value={npr(fin.totalWithdrawalsPaid)} icon={Banknote} tone="blue" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={MAIN} active={tab} onChange={setTab} />
          <Link href="/admin/dashboard/bank-config" className={btn.outline}>
            <Landmark className="w-4 h-4" /> Platform Bank & Limits
          </Link>
        </div>
        {tab === "withdrawals" ? <WithdrawalsTab onChanged={stats.reload} /> : <LedgerTab />}
      </div>
    </>
  );
}

function WithdrawalsTab({ onChanged }: { onChanged: () => void }) {
  const q = useAsync(() => api.getWithdrawals("ALL"), "fin-withdrawals");
  const [filter, setFilter] = useState<(typeof W_FILTERS)[number]["key"]>("PENDING");
  const [reviewing, setReviewing] = useState<{ w: AdminWithdrawal; action: "APPROVE" | "REJECT" } | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const list = useMemo(() => (q.data || []).filter((w) => filter === "ALL" || wGroup(w.status) === filter), [q.data, filter]);
  const count = (k: string) => (q.data || []).filter((w) => k === "ALL" || wGroup(w.status) === k).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={W_FILTERS.map((f) => ({ ...f, label: `${f.label} (${count(f.key)})` }))} active={filter} onChange={setFilter} />
        <div className="flex gap-2">
          <button type="button" onClick={q.reload} className={btn.ghost} aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`} /></button>
          <button type="button" onClick={() => setCreating(true)} className={btn.primary}><Plus className="w-4 h-4" /> Create Withdrawal</button>
        </div>
      </div>
      {notice && <SuccessBanner message={notice} />}
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading withdrawals…" />
        ) : list.length === 0 ? (
          <EmptyState icon={Banknote} title="No withdrawal requests" />
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map((w) => {
              const v = typeof w.vendor === "object" ? w.vendor : null;
              const pending = wGroup(w.status) === "PENDING";
              return (
                <div key={w._id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {v?._id ? <Link href={`/admin/dashboard/vendors/${v._id}`} className="text-sm font-extrabold text-slate-900 hover:text-sky-700 truncate">{vendorName(w.vendor)}</Link> : <span className="text-sm font-extrabold">{vendorName(w.vendor)}</span>}
                      <Pill badge={txnStatusBadge(w.status)} />
                      {w.escalationStatus && w.escalationStatus !== "PENDING_REVIEW" && <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">{w.escalationStatus.replace(/_/g, " ")}</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(w.createdAt)}
                      {v?.bankDetails?.accountNumber ? ` · ${v.bankDetails.bankName || "Bank"} A/C ${v.bankDetails.accountNumber} · IFSC ${v.bankDetails.ifscCode || "—"}` : " · No bank account on file"}
                    </p>
                    {(w.notes || w.internalNotes || w.bankReference || w.rejectionReason) && (
                      <p className="text-xs text-slate-600 mt-1">{[w.bankReference && `Ref ${w.bankReference}`, w.rejectionReason && `Reason: ${w.rejectionReason}`, w.internalNotes && `Staff: ${w.internalNotes}`, w.notes].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                  <p className="text-lg font-extrabold text-slate-900">{npr(Math.abs(w.amount))}</p>
                  {pending && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setReviewing({ w, action: "APPROVE" })} className={`${btn.success} h-9`}>Approve</button>
                      <button type="button" onClick={() => setReviewing({ w, action: "REJECT" })} className={`${btn.danger} h-9`}>Decline</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {reviewing && (
        <ReviewWithdrawalModal
          w={reviewing.w}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={(m) => {
            setReviewing(null);
            setNotice(m);
            q.reload();
            onChanged();
          }}
        />
      )}
      {creating && (
        <CreateForVendor
          onClose={() => setCreating(false)}
          onDone={(m) => {
            setCreating(false);
            setNotice(m);
            q.reload();
            onChanged();
          }}
        />
      )}
    </>
  );
}

/** Create vendor withdrawal modal (app: finance.tsx create withdrawal) */
function CreateForVendor({ onClose, onDone }: { onClose: () => void; onDone: (m: string) => void }) {
  return <CreateWithdrawalModal onClose={onClose} onDone={onDone} />;
}

const LEDGER_PAGE_SIZE = 10;

/** Page buttons like 1 … 4 5 6 … 20 */
function pageList(page: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: Array<number | "…"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

function LedgerTab() {
  const [filter, setFilter] = useState<(typeof L_FILTERS)[number]["key"]>("ALL");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const typeParam = filter === "ALL" ? undefined : L_TYPES[filter]?.join(",");
  const q = useAsync(() => api.getLedger({ search: search || undefined, type: typeParam, page, limit: LEDGER_PAGE_SIZE }), `${search}|${filter}|${page}`);
  const rows = q.data?.data || [];
  const total = q.data?.total || 0;
  const totalPages = Math.max(1, q.data?.totalPages || 1);
  const from = total ? (page - 1) * LEDGER_PAGE_SIZE + 1 : 0;
  const to = Math.min(page * LEDGER_PAGE_SIZE, total);
  const td = "px-5 py-3 whitespace-nowrap";
  return (
    <>
      <form
        className="flex gap-2"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSearch(input.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search notes, payment method or bank reference…" aria-label="Search ledger" />
        </div>
        <button type="submit" className={btn.primary}>Search</button>
      </form>
      <div className="overflow-x-auto no-scrollbar"><Tabs tabs={L_FILTERS} active={filter} onChange={(k) => { setFilter(k); setPage(1); }} /></div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading ledger…" />
        ) : rows.length === 0 ? (
          <EmptyState title="No transactions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  {["Date", "Vendor", "Type", "Order", "Method", "Amount", "Commission", "Status", "Notes"].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((t) => (
                  <tr key={t._id}>
                    <td className={`${td} text-xs text-slate-500`}>{formatDateTime(t.createdAt)}</td>
                    <td className={td}>{vendorName(t.vendor)}</td>
                    <td className={td}>{TXN_LABELS[t.type] || t.type.replace(/_/g, " ")}</td>
                    <td className={td}>{t.order?.orderNumber || "—"}</td>
                    <td className={td}>{t.paymentMethod || t.order?.paymentMethod || "—"}</td>
                    <td className={`${td} font-bold ${t.amount < 0 ? "text-red-600" : "text-slate-900"}`}>{npr(t.amount)}</td>
                    <td className={td}>{t.commissionAmount ? npr(t.commissionAmount) : "—"}</td>
                    <td className={td}><Pill badge={txnStatusBadge(t.status)} /></td>
                    <td className={`${td} max-w-xs truncate`} title={t.notes}>{t.bankReference || t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-slate-600">
            Showing <b>{from}–{to}</b> of <b>{total}</b> entries
          </span>
          {totalPages > 1 && (
            <nav className="flex items-center gap-1.5" aria-label="Ledger pages">
              <button type="button" disabled={page <= 1 || q.loading} onClick={() => setPage((p) => p - 1)} className={`${btn.outline} h-9 px-3`}>Previous</button>
              {pageList(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <span key={`gap${i}`} className="px-1.5 text-slate-400">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`h-9 min-w-9 px-2.5 rounded-xl text-sm font-bold cursor-pointer ${p === page ? "bg-[#0284C7] text-white" : "bg-white border border-slate-200 text-slate-700 hover:border-sky-300"}`}
                  >
                    {p}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages || q.loading} onClick={() => setPage((p) => p + 1)} className={`${btn.outline} h-9 px-3`}>Next</button>
            </nav>
          )}
        </div>
      )}
    </>
  );
}
