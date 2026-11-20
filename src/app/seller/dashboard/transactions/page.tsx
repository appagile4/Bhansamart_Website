"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  HandCoins,
  Info,
  Landmark,
  Loader2,
  Percent,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { fetchVendorStats } from "@/redux/slices/vendorSlice";
import { useVendor } from "@/lib/seller/useVendor";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { TXN_LABELS } from "@/lib/seller/format";
import type { SellerTransaction } from "@/lib/seller/types";

/*
 * Mirrors the app's VendorMain/transaction.tsx ("Finance & Payouts"): same sections, wording,
 * filter tabs, per-type icons/labels/colours (from that screen's StyleSheet) and withdraw modal.
 */
const TABS = [
  { key: "ALL", label: "All" },
  { key: "SETTLED", label: "Settled" },
  { key: "PENDING", label: "Pending" },
  { key: "WITHDRAWAL", label: "Payouts" },
  { key: "COD", label: "COD" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const nprNum = (n?: number | null) => `NPR ${(n || 0).toLocaleString()}`;

export default function TransactionsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <TransactionsView />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="py-16 flex flex-col items-center gap-2">
      <Loader2 className="w-5 h-5 animate-spin text-[#016073]" />
      <p className="text-[13px] text-[#94A3B8]">Loading transactions...</p>
    </div>
  );
}

function TransactionsView() {
  const params = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const v = useVendor();
  const bank = v.vendorProfile?.bankDetails;
  const { data, error, loading, reload } = useAsync(() => api.getTransactions({ limit: 100 }), "txns");
  const [tab, setTab] = useState<TabKey>("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const withdrawOpen = params.get("withdraw") === "1";
  const setWithdrawOpen = (open: boolean) => router.replace(open ? "/seller/dashboard/transactions?withdraw=1" : "/seller/dashboard/transactions");

  const wallet = data?.wallet;
  const txns = useMemo(() => data?.transactions || [], [data]);
  // app: client-side tab filter
  const filtered = useMemo(
    () =>
      txns.filter((t) => {
        if (tab === "SETTLED") return t.type === "ORDER_EARNING" && t.status === "SETTLED";
        if (tab === "PENDING") return t.status === "PENDING" || t.status === "CASH_IN_CUSTODY";
        // Backend writes WITHDRAWAL, WITHDRAWAL_REQUEST and WITHDRAWAL_PAYOUT (the app only matches the first)
        if (tab === "WITHDRAWAL") return t.type.startsWith("WITHDRAWAL");
        if (tab === "COD") return t.type === "COD_COLLECTION" || t.type === "COD_HANDOVER";
        return true;
      }),
    [txns, tab]
  );

  const masked = bank?.accountNumber ? `****${bank.accountNumber.slice(-4)}` : "Not Configured";

  return (
    <div className="text-[#0F172A]">
      {/* Sub header */}
      <div className="flex items-start justify-between gap-3 bg-white border border-[#F1F5F9] rounded-xl px-4 py-3 mb-4">
        <div>
          <h1 className="text-lg font-extrabold text-[#016073]">Finance & Payouts</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Real-time earnings, COD cash tracking, and bank withdrawals</p>
        </div>
        <button type="button" onClick={reload} className="p-2 rounded-lg text-[#016073] hover:bg-[#E6F4F6] cursor-pointer" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2">
        {notice && (
          <p className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-2 text-xs font-semibold text-[#15803D]" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-3 py-2 text-xs font-semibold text-[#991B1B]" role="alert">
            {error}{" "}
            <button type="button" onClick={reload} className="underline cursor-pointer">Retry</button>
          </p>
        )}

        {/* Balance banner */}
        <section className="rounded-[14px] bg-[#016073] text-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#86C4CB]">Withdrawable Balance</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">{nprNum(wallet?.withdrawableBalance)}</p>
            <p className="text-xs text-[#E2E8F0] mt-0.5">Pending Settlement: {nprNum(wallet?.pendingSettlement)}</p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#008080] hover:brightness-110 text-white text-sm font-bold cursor-pointer"
          >
            <Landmark className="w-4 h-4" /> Withdraw
          </button>
        </section>

        {/* COD in custody alert */}
        {(wallet?.codCashWithDeliveryBoys || 0) > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FEF9C3] border border-[#FDE047] px-3 py-2.5">
            <HandCoins className="w-4 h-4 text-[#854D0E] shrink-0" />
            <p className="text-xs font-semibold text-[#854D0E]">NPR {(wallet?.codCashWithDeliveryBoys || 0).toLocaleString()} Cash on Delivery currently with riders.</p>
          </div>
        )}

        {/* Pending recovery deficit alert */}
        {(wallet?.pendingRecoveries || 0) > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FEF2F2] border border-[#FCA5A5] px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <p className="text-xs font-semibold text-[#991B1B]">
              NPR {(wallet?.pendingRecoveries || 0).toLocaleString()} Pending Recovery Deficit: Deducted automatically from future payouts due to post-withdrawal refund.
            </p>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Info className="w-3.5 h-3.5 text-[#86C4CB] shrink-0" />
          Payouts sent to registered bank ({bank?.bankName || "Bank"} A/C {masked}).
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar my-4" role="tablist">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] cursor-pointer ${on ? "bg-[#016073] text-white font-bold" : "bg-[#E2E8F0] text-[#475569] font-semibold"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Transactions list */}
      {loading && !data ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <div className="py-14 flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-[#CBD5E1]" />
          <p className="text-[13px] text-[#94A3B8]">No transactions found for this filter.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
          {filtered.map((t) => (
            <TxnCard key={t._id} t={t} />
          ))}
        </ul>
      )}

      <WithdrawPayoutModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        available={wallet?.withdrawableBalance || 0}
        bankName={bank?.bankName}
        masked={masked}
        holder={bank?.accountHolderName || v.vendorProfile?.businessDetails?.businessName || "Store"}
        onDone={(m) => {
          setNotice(m);
          reload();
          dispatch(fetchVendorStats());
        }}
      />
    </div>
  );
}

// app: renderTransactionCard — type → label / icon / colours
const APP_TYPE_LABELS: Record<string, string> = {
  ORDER_EARNING: "Order Settlement",
  COD_COLLECTION: "COD in Rider Custody",
  COD_HANDOVER: "COD Store Handover",
  WITHDRAWAL: "Bank Withdrawal",
  DIRECT_QR_PAYMENT: "Direct Store QR Paid",
  REFUND_DEDUCTION: "Customer Refund Deduction",
  COMMISSION_REVERSAL: "Commission Reversal (+1.5%)",
  COMMISSION_DEDUCTION: "Platform Commission (-1.5%)",
  RECOVERY_ADJUSTMENT: "Deficit Recovery Offset",
};

function TxnCard({ t }: { t: SellerTransaction }) {
  const isDirectQr = t.type === "DIRECT_QR_PAYMENT";
  const isCredit = t.type === "ORDER_EARNING" || t.type === "COD_HANDOVER" || t.type === "COMMISSION_REVERSAL";
  const isCodCustody = t.type === "COD_COLLECTION";

  let Icon: React.ElementType = isCredit ? ArrowDownLeft : ArrowUpRight;
  let iconColor = isCredit ? "#16A34A" : "#DC2626";
  let iconBg = isCredit ? "#F0FDF4" : "#FEF2F2";
  if (isDirectQr) [Icon, iconColor, iconBg] = [CheckCircle2, "#0284C7", "#F0F9FF"];
  else if (isCodCustody) [Icon, iconColor, iconBg] = [Clock, "#D97706", "#FFFBEB"];
  else if (t.type === "REFUND_DEDUCTION") [Icon, iconColor, iconBg] = [RotateCcw, "#DC2626", "#FEF2F2"];
  else if (t.type === "COMMISSION_REVERSAL") [Icon, iconColor, iconBg] = [RefreshCw, "#16A34A", "#F0FDF4"];
  else if (t.type === "COMMISSION_DEDUCTION") [Icon, iconColor, iconBg] = [Percent, "#EA580C", "#FFF7ED"];
  else if (t.type === "RECOVERY_ADJUSTMENT") [Icon, iconColor, iconBg] = [ShieldAlert, "#7C3AED", "#F5F3FF"];

  // Types the app doesn't know fall back to the website's labels instead of the app's catch-all "Platform Fee"
  const typeLabel = APP_TYPE_LABELS[t.type] || TXN_LABELS[t.type] || "Platform Fee";
  const order = typeof t.order === "object" && t.order ? t.order : null;
  const title = order?.orderNumber ? `Order #${order.orderNumber}` : t.notes || typeLabel;
  const when = new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const amountColor = isDirectQr ? "#0284C7" : isCodCustody ? "#D97706" : isCredit ? "#15803D" : "#DC2626";
  const prefix = isCodCustody ? "" : isDirectQr ? "✓ " : isCredit ? "+" : "-";

  const badge: Record<string, [string, string]> = {
    SETTLED: ["#DCFCE7", "#15803D"],
    COMPLETED: ["#DCFCE7", "#15803D"],
    DIRECT_SETTLED: ["#E0F2FE", "#0369A1"],
    CASH_IN_CUSTODY: ["#FEF9C3", "#854D0E"],
    PENDING: ["#EFF6FF", "#1D4ED8"],
    RECOVERED: ["#F3E8FF", "#7E22CE"],
  };
  const [badgeBg, badgeColor] = badge[t.status] || ["#F1F5F9", "#475569"];
  const statusText = t.status === "CASH_IN_CUSTODY" ? "In Custody" : t.status === "DIRECT_SETTLED" ? "Direct Paid" : t.status;

  return (
    <li className="flex items-center justify-between gap-3 bg-white border border-[#F1F5F9] rounded-xl px-3.5 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
        </span>
        <div className="min-w-0 pr-2">
          <p className="text-sm font-bold text-[#0F172A] truncate">{title}</p>
          <p className="text-xs text-[#64748B] truncate">
            {typeLabel} · {when}
          </p>
          {(t.grossAmount || 0) > 0 && (t.commission || 0) > 0 && (
            <p className="text-[11px] text-[#94A3B8]">
              Gross: NPR {t.grossAmount} · Superadmin Fee (1.5%): NPR {t.commission}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-sm font-extrabold" style={{ color: amountColor }}>
          {prefix} NPR {Math.abs(t.amount).toLocaleString()}
        </p>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: badgeBg, color: badgeColor }}>
          {statusText}
        </span>
      </div>
    </li>
  );
}

/** app: transaction.tsx "Withdraw Payout" modal (min NPR 100, max = withdrawable balance) */
function WithdrawPayoutModal({
  open,
  onClose,
  available,
  bankName,
  masked,
  holder,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  available: number;
  bankName?: string;
  masked: string;
  holder: string;
  onDone: (message: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ title: string; text: string } | null>(null);

  const close = () => {
    setAmount("");
    setNotes("");
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return setError({ title: "Invalid Amount", text: "Please enter a valid withdrawal amount." });
    if (amt < 100) return setError({ title: "Minimum Limit", text: "Minimum withdrawal amount is NPR 100." });
    if (amt > available) return setError({ title: "Insufficient Balance", text: `Your withdrawable balance is NPR ${available.toLocaleString()}.` });
    setBusy(true);
    setError(null);
    try {
      await api.requestWithdrawal(amt, notes.trim() || undefined);
      onDone(`Withdrawal Requested: Withdrawal of NPR ${amt.toLocaleString()} has been queued for daily bank settlement.`);
      close();
    } catch (e) {
      setError({ title: "Withdrawal Failed", text: api.errorText(e, "Failed to process withdrawal request.") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="withdraw-title" onMouseDown={close}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h2 id="withdraw-title" className="text-base font-extrabold text-[#016073]">Withdraw Payout</h2>
          <button type="button" onClick={close} className="p-1 rounded-lg hover:bg-[#F8FAFC] cursor-pointer" aria-label="Close">
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="rounded-lg bg-[#F0FDF4] px-3 py-2.5">
            <p className="text-xs text-[#15803D]">Available Withdrawable Balance:</p>
            <p className="text-lg font-extrabold text-[#15803D]">NPR {available.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] px-3 py-2.5">
            <p className="text-xs text-[#64748B]">Payout Destination:</p>
            <p className="text-sm font-bold text-[#0F172A]">
              {bankName || "Bank"} • A/C: {masked}
            </p>
            <p className="text-xs text-[#94A3B8]">Holder: {holder}</p>
          </div>
          <label className="block">
            <span className="block text-xs font-bold text-[#334155] mb-1">Withdrawal Amount (NPR):</span>
            <input
              className="w-full h-10 px-3 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#016073]"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 5000"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-[#334155] mb-1">Remarks / Reference (Optional):</span>
            <textarea
              className="w-full h-16 px-3 py-2 rounded-lg border border-[#CBD5E1] text-sm text-[#0F172A] focus:outline-none focus:border-[#016073] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Weekly settlement"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]" role="alert">
              <span className="font-bold">{error.title}:</span> {error.text}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button type="button" onClick={close} className="h-10 rounded-lg bg-[#F1F5F9] text-[#64748B] text-sm font-bold cursor-pointer">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={busy} className="h-10 rounded-lg bg-[#016073] text-white text-sm font-bold inline-flex items-center justify-center cursor-pointer disabled:opacity-70">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
