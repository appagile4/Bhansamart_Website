"use client";

import React, { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminVendorDetails, AdminWithdrawal } from "@/lib/admin/types";
import {
  formatDate,
  formatDateTime,
  npr,
  orderStatusBadge,
  refundStatusBadge,
  txnStatusBadge,
  TXN_LABELS,
} from "@/lib/seller/format";
import { storeName, vendorStatusBadge } from "@/lib/admin/format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  Pill,
  StatCard,
  SuccessBanner,
  btn,
  field,
  fieldLabel,
} from "@/components/admin/ui";
import {
  CreateWithdrawalModal,
  ReviewWithdrawalModal,
} from "@/components/admin/WithdrawalModals";
import { useConsole } from "@/lib/admin/console";

type TabKey =
  | "orders"
  | "transactions"
  | "claims"
  | "financials"
  | "customers"
  | "products"
  | "withdrawals"
  | "risk";

export default function VendorDetailsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading vendor…" />}>
      <VendorDetailsView />
    </Suspense>
  );
}

function VendorDetailsView() {
  const { staff, base } = useConsole();
  const { id } = useParams<{ id: string }>();
  const q = useAsync(() => api.getVendorDetails(id), id);
  const [tab, setTab] = useState<TabKey>("orders");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewing, setReviewing] = useState<{
    w: AdminWithdrawal;
    action: "APPROVE" | "REJECT";
  } | null>(null);

  const d = q.data;
  if (q.loading && !d) return <LoadingBlock text="Loading vendor…" />;
  if (!d)
    return (
      <ErrorBanner
        message={q.error || "Vendor not found."}
        onRetry={q.reload}
      />
    );

  const v = d.vendor;
  const badge = vendorStatusBadge(
    v.status || v.businessDetails?.verificationStatus,
  );
  const approved = badge.label === "Approved";

  const verify = async (
    status: "approved" | "rejected" | "pending",
    reason?: string,
  ) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await api.setVendorVerification(v._id, status, reason);
      setNotice(`Vendor verification set to ${status}.`);
      setRejectOpen(false);
      q.reload();
    } catch (e) {
      setActionError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "orders", label: `Orders (${d.orders.length})` },
    {
      key: "transactions",
      label: `Product Sales (${d.productTransactions.length})`,
    },
    { key: "claims", label: `Refund & Replace (${d.claims.totalClaims})` },
    { key: "financials", label: "Financials & Profits" },
    { key: "customers", label: `Buyers (${d.stats.uniqueCustomersCount})` },
    { key: "products", label: `Catalog (${d.stats.productsCount})` },
    { key: "withdrawals", label: `Payouts (${d.withdrawals.length})` },
    { key: "risk", label: `Risk & Tickets (${d.tickets.openTicketsCount})` },
  ];

  return (
    <>
      <PageHeader
        backHref={`${base}/vendors`}
        title={storeName(v)}
        subtitle={`Joined ${formatDate(v.createdAt)}${d.assignedAdmin?.name ? ` · Staff admin: ${d.assignedAdmin.name}` : ""}`}
        actions={
          <>
            <button
              type="button"
              onClick={q.reload}
              className={btn.ghost}
              aria-label="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`}
              />
            </button>
            {!approved && (
              <button
                type="button"
                disabled={busy}
                onClick={() => verify("approved")}
                className={btn.success}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve KYC
              </button>
            )}
            {badge.label !== "Rejected" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
                className={btn.danger}
              >
                <XCircle className="w-4 h-4" /> Revoke
              </button>
            )}
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {actionError && <ErrorBanner message={actionError} />}

        {/* Store identity */}
        <Card className="p-5">
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <span className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {v.brandDetails?.brandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.brandDetails.brandLogo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-7 h-7 text-slate-400" />
                )}
              </span>
              <div className="min-w-0 space-y-1 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${v.isStoreOpen ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                  >
                    {v.isStoreOpen ? "Store Open" : "Store Closed"}
                  </span>
                  {v.businessDetails?.businessType && (
                    <span className="px-2 py-0.5 rounded-full border border-slate-200 text-[11px] text-slate-600">
                      {v.businessDetails.businessType}
                    </span>
                  )}
                </div>
                <p className="text-slate-700">
                  <span className="font-bold">
                    {v.sellerDetails?.sellerName ||
                      (typeof v.userId === "object" ? v.userId?.name : "")}
                  </span>
                </p>
                <p className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  {(v.sellerDetails?.sellerPhone ||
                    v.businessDetails?.businessPhone) && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />{" "}
                      {v.sellerDetails?.sellerPhone ||
                        v.businessDetails?.businessPhone}
                    </span>
                  )}
                  {(v.sellerDetails?.sellerEmail ||
                    v.businessDetails?.businessEmail) && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3" />{" "}
                      {v.sellerDetails?.sellerEmail ||
                        v.businessDetails?.businessEmail}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{" "}
                    {[
                      v.shippingLocations?.warehouseAddress ||
                        v.sellerDetails?.address,
                      v.shippingLocations?.city || v.sellerDetails?.city,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  GST {v.businessDetails?.gstNumber || "—"} · PAN{" "}
                  {v.businessDetails?.panNumber || "—"} · Categories{" "}
                  {v.businessDetails?.categories?.join(", ") || "—"}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs space-y-1 lg:w-80">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-sky-600" /> Bank Credentials
              </p>
              {v.bankDetails?.accountNumber ? (
                <>
                  <p>
                    {v.bankDetails.accountHolderName} · {v.bankDetails.bankName}
                  </p>
                  <p>
                    A/C {v.bankDetails.accountNumber} · IFSC{" "}
                    {v.bankDetails.ifscCode}{" "}
                    {v.bankDetails.branch ? `· ${v.bankDetails.branch}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-amber-700">No bank account on file.</p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Lifetime Gross Sales"
            value={npr(d.financials.totalGrossSales)}
            tone="green"
          />
          <StatCard
            label="Commission Paid (1.5%)"
            value={npr(d.financials.totalCommissionPaid)}
            tone="blue"
          />
          <StatCard
            label="Wallet Balance"
            value={npr(d.financials.currentWalletBalance)}
            sub={`${d.financials.pendingWithdrawalsCount} pending payout(s) · ${npr(d.financials.pendingWithdrawalsAmount)}`}
            tone="violet"
          />
          <StatCard
            label="Orders"
            value={d.stats.ordersCount}
            sub={`${d.stats.deliveredOrders} delivered · ${d.stats.cancelledOrders} cancelled`}
            tone="amber"
          />
        </div>

        <div
          className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold border cursor-pointer ${tab === t.key ? "bg-sky-700 border-sky-700 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-sky-600"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          {/* Payout approval / creation are super-admin-only on the backend */}
          <VendorTab
            tab={tab}
            d={d}
            onReview={
              staff ? undefined : (w, action) => setReviewing({ w, action })
            }
            onCreate={staff ? undefined : () => setCreateOpen(true)}
          />
        </Card>
      </div>

      {rejectOpen && (
        <ReasonModal
          title="Revoke vendor KYC"
          confirm="Revoke Vendor"
          busy={busy}
          onClose={() => setRejectOpen(false)}
          onConfirm={(r) => verify("rejected", r)}
        />
      )}
      {reviewing && (
        <ReviewWithdrawalModal
          w={reviewing.w}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={(m) => {
            setReviewing(null);
            setNotice(m);
            q.reload();
          }}
        />
      )}
      {createOpen && (
        <CreateWithdrawalModal
          vendorId={v._id}
          available={d.financials.currentWalletBalance}
          onClose={() => setCreateOpen(false)}
          onDone={(m) => {
            setCreateOpen(false);
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

function Table({
  head,
  children,
}: {
  head: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">{children}</tbody>
      </table>
    </div>
  );
}

const td = "px-5 py-3 whitespace-nowrap";

function VendorTab({
  tab,
  d,
  onReview,
  onCreate,
}: {
  tab: TabKey;
  d: AdminVendorDetails;
  onReview?: (w: AdminWithdrawal, a: "APPROVE" | "REJECT") => void;
  onCreate?: () => void;
}) {
  switch (tab) {
    case "orders":
      return d.orders.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <Table
          head={[
            "Order",
            "Customer",
            "Items",
            "Amount",
            "Commission",
            "Vendor Net",
            "Payment",
            "Status",
            "Placed",
          ]}
        >
          {d.orders.map((o) => (
            <tr key={o._id}>
              <td className={`${td} font-bold text-slate-900`}>
                {o.orderNumber}
              </td>
              <td className={td}>{o.customer?.name || "Customer"}</td>
              <td className={td}>{o.itemsCount ?? o.items?.length ?? 0}</td>
              <td className={`${td} font-bold`}>{npr(o.totalAmount)}</td>
              <td className={td}>{npr(o.commissionAmount)}</td>
              <td className={td}>{npr(o.vendorNetAmount)}</td>
              <td className={td}>
                {o.paymentMethod} ·{" "}
                <span className="uppercase text-[11px]">{o.paymentStatus}</span>
              </td>
              <td className={td}>
                <Pill badge={orderStatusBadge(o.orderStatus)} />
              </td>
              <td className={`${td} text-xs text-slate-500`}>
                {formatDateTime(o.createdAt)}
              </td>
            </tr>
          ))}
        </Table>
      );
    case "transactions":
      return d.productTransactions.length === 0 ? (
        <EmptyState title="No product sales recorded" />
      ) : (
        <Table
          head={[
            "Type",
            "Order",
            "Customer",
            "Items",
            "Gross",
            "Commission",
            "Net",
            "Status",
            "Date",
          ]}
        >
          {d.productTransactions.map((t) => (
            <tr key={t._id}>
              <td className={td}>{TXN_LABELS[t.type] || t.type}</td>
              <td className={`${td} font-semibold`}>{t.orderNumber}</td>
              <td className={td}>{t.customerName}</td>
              <td className={`${td} max-w-xs truncate`} title={t.itemsSummary}>
                {t.itemsSummary}
              </td>
              <td className={td}>{npr(t.grossAmount)}</td>
              <td className={td}>{npr(t.commission)}</td>
              <td className={`${td} font-bold`}>{npr(t.netAmount)}</td>
              <td className={td}>
                <Pill badge={txnStatusBadge(t.status)} />
              </td>
              <td className={`${td} text-xs text-slate-500`}>
                {formatDateTime(t.createdAt)}
              </td>
            </tr>
          ))}
        </Table>
      );
    case "claims":
      return (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-5 border-b border-slate-100 text-center text-xs">
            {[
              ["Refunds", d.claims.refundsCount],
              ["Returns", d.claims.returnsCount],
              ["Replacements", d.claims.replacementsCount],
              ["Pending", d.claims.pendingClaimsCount],
              ["Refunded", npr(d.claims.totalRefundAmount)],
            ].map(([k, val]) => (
              <div key={k as string} className="rounded-lg bg-slate-50 py-2">
                <p className="text-sm font-extrabold text-slate-900">{val}</p>
                <p className="text-slate-500">{k}</p>
              </div>
            ))}
          </div>
          {d.claims.list.length === 0 ? (
            <EmptyState title="No refund or replacement claims" />
          ) : (
            <Table
              head={[
                "Claim",
                "Type",
                "Order",
                "Customer",
                "Reason",
                "Amount",
                "Vendor Deduction",
                "Status",
                "Date",
              ]}
            >
              {d.claims.list.map((c) => (
                <tr key={c._id}>
                  <td className={`${td} font-semibold`}>{c.refundNumber}</td>
                  <td className={td}>{c.claimType.replace(/_/g, " ")}</td>
                  <td className={td}>{c.orderNumber}</td>
                  <td className={td}>{c.customerName}</td>
                  <td className={`${td} max-w-xs truncate`} title={c.reason}>
                    {c.reason}
                  </td>
                  <td className={`${td} font-bold`}>{npr(c.amount)}</td>
                  <td className={td}>{npr(c.vendorDeduction)}</td>
                  <td className={td}>
                    <Pill badge={refundStatusBadge(c.status)} />
                  </td>
                  <td className={`${td} text-xs text-slate-500`}>
                    {formatDate(c.createdAt)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      );
    case "financials":
      return (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ["Lifetime gross sales", npr(d.financials.totalGrossSales)],
            ["Platform commission paid", npr(d.financials.totalCommissionPaid)],
            ["Vendor net earnings", npr(d.financials.netEarnings)],
            ["Current wallet balance", npr(d.financials.currentWalletBalance)],
            ["Pending settlement", npr(d.vendor.wallet?.pendingSettlement)],
            [
              "COD cash with riders",
              npr(d.vendor.wallet?.codCashWithDeliveryBoys),
            ],
            ["Pending recoveries", npr(d.vendor.wallet?.pendingRecoveries)],
            [
              "Pending payouts",
              `${d.financials.pendingWithdrawalsCount} · ${npr(d.financials.pendingWithdrawalsAmount)}`,
            ],
            ["Total payouts settled", npr(d.financials.totalWithdrawalsPaid)],
          ].map(([k, val]) => (
            <div
              key={k}
              className="flex justify-between rounded-xl bg-slate-50 px-4 py-3"
            >
              <span className="text-slate-600">{k}</span>
              <span className="font-extrabold text-slate-900">{val}</span>
            </div>
          ))}
        </div>
      );
    case "customers":
      return d.customers.length === 0 ? (
        <EmptyState title="No buyers yet" />
      ) : (
        <Table
          head={[
            "Buyer",
            "Phone",
            "Email",
            "Orders",
            "Total Spent",
            "Last Order",
          ]}
        >
          {d.customers.map((c) => (
            <tr key={c._id}>
              <td className={`${td} font-semibold`}>{c.name}</td>
              <td className={td}>{c.phone || "—"}</td>
              <td className={td}>{c.email || "—"}</td>
              <td className={td}>{c.ordersCount}</td>
              <td className={`${td} font-bold`}>{npr(c.totalSpent)}</td>
              <td className={`${td} text-xs text-slate-500`}>
                {formatDate(c.lastOrderDate)}
              </td>
            </tr>
          ))}
        </Table>
      );
    case "products":
      return d.products.length === 0 ? (
        <EmptyState title="No products listed" />
      ) : (
        <Table head={["Product", "Category", "Price", "Stock", "Status"]}>
          {d.products.map((p, i) => (
            <tr key={(p._id as string) || i}>
              <td className={`${td} font-semibold`}>{p.name}</td>
              <td className={td}>{String(p.category || "—")}</td>
              <td className={td}>{npr(p.price)}</td>
              <td className={td}>{p.stock ?? "—"}</td>
              <td className={td}>
                {p.isActive === false ? "Disabled" : "Active"}
              </td>
            </tr>
          ))}
        </Table>
      );
    case "withdrawals":
      return (
        <div>
          {onCreate && (
            <div className="p-4 flex justify-end border-b border-slate-100">
              <button type="button" onClick={onCreate} className={btn.primary}>
                <Plus className="w-4 h-4" /> Create Withdrawal
              </button>
            </div>
          )}
          {d.withdrawals.length === 0 ? (
            <EmptyState icon={Banknote} title="No payout requests" />
          ) : (
            <Table
              head={[
                "Requested",
                "Amount",
                "Status",
                "Reference / Notes",
                "Actions",
              ]}
            >
              {d.withdrawals.map((w) => {
                const pending = ["PENDING", "SUBMITTED"].includes(w.status);
                return (
                  <tr key={w._id}>
                    <td className={`${td} text-xs text-slate-500`}>
                      {formatDateTime(w.createdAt)}
                    </td>
                    <td className={`${td} font-bold`}>
                      {npr(Math.abs(w.amount))}
                    </td>
                    <td className={td}>
                      <Pill badge={txnStatusBadge(w.status)} />
                    </td>
                    <td className={`${td} max-w-xs truncate`}>
                      {w.bankReference || w.rejectionReason || w.notes || "—"}
                    </td>
                    <td className={td}>
                      {pending && onReview ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onReview(w, "APPROVE")}
                            className={`${btn.success} h-8 px-3`}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReview(w, "REJECT")}
                            className={`${btn.danger} h-8 px-3`}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </div>
      );
    case "risk":
      return (
        <div>
          <div
            className={`m-5 rounded-xl p-4 text-sm flex items-start gap-3 ${d.tickets.riskLevel === "HIGH" ? "bg-red-50 text-red-800" : d.tickets.riskLevel === "MEDIUM" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-extrabold">
                Risk level: {d.tickets.riskLevel || "LOW"}
              </p>
              {d.tickets.riskReason && (
                <p className="text-xs mt-0.5">{d.tickets.riskReason}</p>
              )}
            </div>
          </div>
          {d.tickets.list.length === 0 ? (
            <EmptyState title="No support tickets" />
          ) : (
            <Table head={["Ticket", "Subject", "Priority", "Status", "Opened"]}>
              {d.tickets.list.map((t) => (
                <tr key={t._id}>
                  <td className={`${td} font-semibold`}>
                    {t.ticketNumber || t._id.slice(-6)}
                  </td>
                  <td className={`${td} max-w-sm truncate`}>{t.subject}</td>
                  <td className={`${td} capitalize`}>{t.priority}</td>
                  <td className={td}>{t.status.replace(/_/g, " ")}</td>
                  <td className={`${td} text-xs text-slate-500`}>
                    {formatDate(t.createdAt)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      );
  }
}

function ReasonModal({
  title,
  confirm,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  confirm: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(reason.trim())}
            className={btn.danger}
          >
            {busy ? "Saving…" : confirm}
          </button>
        </>
      }
    >
      <label className="block">
        <span className={fieldLabel}>Reason</span>
        <textarea
          className={`${field} h-24 py-2`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
    </Modal>
  );
}
