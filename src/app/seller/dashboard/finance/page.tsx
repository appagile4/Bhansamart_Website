"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BadgeCheck, Bike, Clock4, HandCoins, Plus, RefreshCw, Wallet } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchCodSummary, fetchVendorStats } from "@/redux/slices/vendorSlice";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime, npr } from "@/lib/seller/format";
import TransactionList from "@/components/vendor/TransactionList";
import WithdrawModal from "@/components/vendor/WithdrawModal";
import { Card, EmptyState, ErrorBanner, LoadingBlock, PageHeader, StatCard, SuccessBanner, Tabs, btn } from "@/components/vendor/ui";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "settlements", label: "Settlements" },
  { key: "delivery", label: "Delivery Boy Cash" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function FinancePage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading finance…" />}>
      <FinanceView />
    </Suspense>
  );
}

function FinanceView() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const cod = useVendor().codSummary;
  const raw = params.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "overview";

  const { data, error, loading, reload } = useAsync(() => api.getTransactions({ limit: 100 }), "finance");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const wallet = data?.wallet;
  const txns = useMemo(() => data?.transactions || [], [data]);
  const withdrawals = useMemo(() => txns.filter((t) => t.type.startsWith("WITHDRAWAL")), [txns]);
  const settlements = useMemo(() => txns.filter((t) => t.type === "ORDER_EARNING" && t.status === "SETTLED"), [txns]);
  const pendingPayouts = withdrawals.filter((t) => ["PENDING", "SUBMITTED"].includes(t.status)).reduce((n, t) => n + Math.abs(t.amount), 0);
  const completedPayouts = withdrawals.filter((t) => ["COMPLETED", "SETTLED"].includes(t.status)).reduce((n, t) => n + Math.abs(t.amount), 0);

  const refresh = () => {
    reload();
    dispatch(fetchCodSummary());
    dispatch(fetchVendorStats());
  };

  return (
    <>
      <PageHeader
        title="Finance & Expense"
        subtitle="Payouts, settlements & rider cash"
        actions={
          <>
            <button type="button" onClick={refresh} className={btn.outline} aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => setWithdrawOpen(true)} className={btn.primary} disabled={!wallet?.withdrawableBalance}>
              <Wallet className="w-4 h-4" /> Withdraw
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} onRetry={reload} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-vendor-dark to-vendor text-white p-5 flex flex-col justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold">
                <BadgeCheck className="w-3.5 h-3.5 text-vendor-accent" /> Ready for Payout
              </span>
              <p className="text-xs text-white/70 mt-3">Available Balance</p>
              <p className="text-3xl font-extrabold">{npr(wallet?.withdrawableBalance)}</p>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              disabled={!wallet?.withdrawableBalance}
              className="h-10 rounded-lg bg-white text-vendor-dark font-extrabold text-sm hover:bg-vendor-soft cursor-pointer disabled:opacity-60"
            >
              Request Withdrawal
            </button>
          </section>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Settled Lifetime" value={npr(wallet?.totalEarned)} sub="Total credited" icon={BadgeCheck} tone="green" />
            <StatCard label="Pending Settlement" value={npr(wallet?.pendingSettlement)} sub="In processing window" icon={Clock4} tone="amber" />
            <StatCard label="COD with Riders" value={npr(wallet?.codCashWithDeliveryBoys)} sub="Accept cash handover →" icon={HandCoins} tone="violet" href="/seller/dashboard/cod-handover" />
          </div>
        </div>

        <Tabs tabs={TABS} active={tab} onChange={(k) => router.replace(k === "overview" ? "/seller/dashboard/finance" : `/seller/dashboard/finance?tab=${k}`)} />

        {loading && !data ? (
          <LoadingBlock text="Loading finance…" />
        ) : tab === "overview" ? (
          <Card title="Recent Financial Records" action={<Link href="/seller/dashboard/transactions" className="text-xs font-bold text-vendor-teal hover:underline">All transactions</Link>}>
            <TransactionList items={txns.slice(0, 15)} />
          </Card>
        ) : tab === "withdrawals" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Pending Payouts" value={npr(pendingPayouts)} tone="amber" icon={Clock4} />
              <StatCard label="Completed Payouts" value={npr(completedPayouts)} tone="green" icon={BadgeCheck} />
            </div>
            <Card
              title="Withdrawal History"
              action={
                <button type="button" onClick={() => setWithdrawOpen(true)} className="text-xs font-bold text-vendor-teal hover:underline inline-flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> New Request
                </button>
              }
            >
              <TransactionList items={withdrawals} emptyTitle="No Withdrawal Requests" />
            </Card>
          </div>
        ) : tab === "settlements" ? (
          <Card title="Settled Store Earnings">
            <TransactionList items={settlements} emptyTitle="No Settled Orders Yet" />
          </Card>
        ) : (
          <div className="space-y-4">
            <Card
              title="Cash held by delivery partners"
              action={
                <Link href="/seller/dashboard/cod-handover" className="text-xs font-bold text-vendor-teal hover:underline inline-flex items-center gap-1">
                  Accept Cash Handover <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              {!cod ? (
                <LoadingBlock />
              ) : cod.ridersDue.length === 0 ? (
                <EmptyState icon={Bike} title="All Clear!" text="No rider is holding COD cash for your store." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {cod.ridersDue.map((r) => (
                    <li key={r.deliveryBoy._id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                      <span>
                        <span className="font-bold text-slate-900">{r.deliveryBoy.fullName}</span>
                        <span className="text-xs text-slate-500"> · {r.ordersCount} order(s)</span>
                      </span>
                      <span className="font-extrabold text-violet-700">{npr(r.totalDue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Recent Handover Receipts">
              {!cod?.recentHandovers.length ? (
                <EmptyState icon={HandCoins} title="No handovers yet" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {cod.recentHandovers.map((h) => (
                    <li key={h._id} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                      <span>
                        <span className="font-bold text-slate-900">#{h.receiptNumber}</span> · {h.deliveryBoy?.fullName} · {formatDateTime(h.createdAt)}
                      </span>
                      <span className="font-extrabold text-emerald-700">{npr(h.amountSubmitted)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        available={wallet?.withdrawableBalance || 0}
        onDone={(m) => {
          setNotice(m);
          refresh();
        }}
      />
    </>
  );
}
