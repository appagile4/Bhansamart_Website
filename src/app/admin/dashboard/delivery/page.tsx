"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Bike, Eye, MapPin, Phone, Search, Star } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { useConsole } from "@/lib/admin/console";
import type { CodReconRow } from "@/lib/admin/types";
import { initials, npr } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, StatCard, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";

const TABS = [
  { key: "fleet", label: "Delivery Fleet" },
  { key: "cod", label: "COD Reconciliation" },
] as const;

/** app: Screens/adminScreens/delivery.tsx */
export default function DeliveryPage() {
  // Staff console: /staff_admin/dashboard/cod opens straight on COD (app: CODReconciliationScreen)
  const pathname = usePathname();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>(pathname?.endsWith("/cod") ? "cod" : "fleet");
  return (
    <>
      <PageHeader title="Delivery Partners & COD" subtitle="Rider fleet status and cash-on-delivery handover reconciliation." />
      <div className="space-y-4">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === "fleet" ? <FleetTab /> : <CodTab />}
      </div>
    </>
  );
}

function FleetTab() {
  const { base } = useConsole();
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const q = useAsync(() => api.getRiders({ search: search || undefined }), `riders-${search}`);
  const riders = useMemo(() => (q.data || []).filter((r) => !onlineOnly || r.isOnline), [q.data, onlineOnly]);
  const all = q.data || [];

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Riders" value={all.length} icon={Bike} />
        <StatCard label="Online" value={all.filter((r) => r.isOnline).length} tone="green" />
        <StatCard label="On a delivery" value={all.filter((r) => r.isBusy).length} tone="amber" />
        <StatCard label="COD in custody" value={npr(all.reduce((n, r) => n + (r.cashInHand || 0), 0))} tone="violet" />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <form className="flex gap-2 flex-1" role="search" onSubmit={(e) => { e.preventDefault(); setSearch(input.trim()); }}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search rider name or phone…" aria-label="Search riders" />
          </div>
          <button type="submit" className={btn.primary}>Search</button>
        </form>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} className="w-4 h-4 accent-sky-600" /> Online only
        </label>
      </div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      {q.loading && !q.data ? (
        <LoadingBlock text="Loading fleet…" />
      ) : riders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100"><EmptyState icon={Bike} title="No delivery partners" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {riders.map((r) => {
            const status = r.isBusy ? { t: "On delivery", c: "bg-amber-50 text-amber-700" } : r.isOnline ? { t: "Online", c: "bg-emerald-50 text-emerald-700" } : { t: "Offline", c: "bg-slate-100 text-slate-500" };
            return (
              <article key={r._id} className="bg-white rounded-2xl border border-slate-200/80 hover:border-sky-300 transition-all p-4 space-y-3 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-full bg-sky-100 text-sky-800 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                      {r.profilePhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.profilePhoto} alt="" className="w-full h-full object-cover" />
                      ) : initials(r.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link href={`${base}/delivery/${r._id}`} className="text-sm font-extrabold text-slate-900 truncate hover:text-[#0284C7] transition-colors block">
                        {r.name}
                      </Link>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone || "—"} · {r.vehicleNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.c}`}>{status.t}</span>
                  </div>

                  {/* Primary Zone & City */}
                  <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-sky-800 font-bold flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                      <span className="truncate">Zone: {r.serviceArea || "Central Kathmandu"}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-sky-600 shrink-0">
                      {r.serviceCity || "Kathmandu"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold">{r.completedDeliveries}</p><p className="text-slate-500">Deliveries</p></div>
                    <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{(r.metrics?.rating ?? 5).toFixed(1)}</p><p className="text-slate-500">Rating</p></div>
                    <div className="rounded-lg bg-slate-50 py-2"><p className="text-sm font-extrabold truncate px-1">{npr(r.cashInHand)}</p><p className="text-slate-500">Cash in hand</p></div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    KYC {r.approvalStatus || "—"}
                    {r.activeOrderId?.orderNumber ? ` · Active order ${r.activeOrderId.orderNumber} (${npr(r.activeOrderId.totalAmount)})` : ""}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2">
                  <Link
                    href={`${base}/delivery/${r._id}`}
                    className={`${btn.outline} w-full h-8 text-xs justify-center font-bold`}
                  >
                    <Eye className="w-3.5 h-3.5" /> View Profile & Zone
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

const codBadge = (s: string) =>
  s === "RECONCILED" || s === "SETTLED" ? { t: "Settled", c: "bg-emerald-50 text-emerald-700" } : s === "DISCREPANCY_REPORTED" || s === "MISMATCH_DISPUTE" ? { t: "Discrepancy Reported", c: "bg-red-50 text-red-700" } : { t: "Awaiting Handover", c: "bg-amber-50 text-amber-700" };

function CodTab() {
  const q = useAsync(() => api.getCodReconciliation(), "cod-recon");
  const [search, setSearch] = useState("");
  const [disputing, setDisputing] = useState<CodReconRow | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const s = search.trim().toLowerCase();
  const rows = (q.data?.reconciliation || []).filter((r) => !s || [r.deliveryBoyName, r.vendorName, r.phone].some((f) => (f || "").toLowerCase().includes(s)));
  const sum = q.data?.summary;

  return (
    <>
      {sum && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Expected COD" value={npr(sum.totalExpectedCod)} sub={`${sum.totalOrders} delivered COD orders`} tone="blue" />
          <StatCard label="Collected" value={npr(sum.totalCollected)} tone="green" />
          <StatCard label="Vendor Confirmed" value={npr(sum.totalVendorConfirmed)} sub={`${npr(sum.totalHandedOver)} handed over`} tone="violet" />
          <StatCard label="Outstanding" value={npr(sum.totalOutstanding)} sub={`${sum.totalDiscrepancies} discrepancies`} tone="red" />
        </div>
      )}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rider, store or phone…" aria-label="Search COD reconciliation" />
      </div>
      {notice && <SuccessBanner message={notice} />}
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading COD reconciliation…" />
        ) : rows.length === 0 ? (
          <EmptyState title="No COD handovers to reconcile" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const key = `${r.deliveryBoyId}-${r.vendorId}`;
              const b = codBadge(r.reconciliationStatus);
              return (
                <li key={key} className="p-4 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold">{r.deliveryBoyName}</span>
                        <span className="text-xs text-slate-500">→ {r.vendorName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.c}`}>{b.t}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{r.phone || "—"} · {r.ordersCount} orders · {r.handoversCount} handovers{r.recentReceipts?.length ? ` · Receipts ${r.recentReceipts.join(", ")}` : ""}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-right">
                      <div><p className="text-slate-500">Expected</p><p className="font-bold">{npr(r.expectedCod)}</p></div>
                      <div><p className="text-slate-500">Confirmed</p><p className="font-bold">{npr(r.totalVendorConfirmed)}</p></div>
                      <div><p className="text-slate-500">Outstanding</p><p className={`font-bold ${r.outstanding > 0 ? "text-red-600" : ""}`}>{npr(r.outstanding)}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setExpanded(expanded === key ? null : key)} className={`${btn.ghost} h-9`} aria-expanded={expanded === key}>Orders</button>
                      <button type="button" onClick={() => setDisputing(r)} className={`${btn.danger} h-9`}><AlertTriangle className="w-4 h-4" /> Dispute</button>
                    </div>
                  </div>
                  {r.discrepancies.length > 0 && (
                    <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800 space-y-1">
                      {r.discrepancies.map((d) => <p key={d.orderId}>{d.orderNumber}: expected {npr(d.expectedAmount)}, received {npr(d.actualAmount)} (short {npr(d.shortfall)}){d.reason ? ` — ${d.reason}` : ""}</p>)}
                    </div>
                  )}
                  {expanded === key && (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs">
                        <thead><tr className="text-left text-slate-500 bg-slate-50">{["Order", "Due", "Collected", "Handed over", "Status", "Vendor confirmed"].map((h) => <th key={h} className="px-3 py-2 font-bold">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {r.orders.map((o) => (
                            <tr key={o.orderId}><td className="px-3 py-2 font-semibold">{o.orderNumber}</td><td className="px-3 py-2">{npr(o.amountDue)}</td><td className="px-3 py-2">{npr(o.amountCollected)}</td><td className="px-3 py-2">{npr(o.amountHandedOver)}</td><td className="px-3 py-2">{o.status.replace(/_/g, " ")}</td><td className="px-3 py-2">{o.vendorConfirmed ? "Yes" : "No"}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {disputing && (
        <DisputeModal
          row={disputing}
          onClose={() => setDisputing(null)}
          onDone={(m) => {
            setDisputing(null);
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

function DisputeModal({ row, onClose, onDone }: { row: CodReconRow; onClose: () => void; onDone: (m: string) => void }) {
  const [amount, setAmount] = useState(String(row.outstanding || 0));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!amount.trim() || Number(amount) <= 0) return setError("Please enter a valid disputed amount.");
    if (!reason.trim()) return setError("Please specify the reason for raising this COD mismatch dispute.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.raiseCodDispute({ deliveryBoyId: row.deliveryBoyId, vendorId: row.vendorId, disputedAmount: Number(amount), notes: `Reason: ${reason.trim()}${notes.trim() ? `. ${notes.trim()}` : ""}` });
      onDone(r.message || "Cash mismatch dispute raised and forwarded to financial audit.");
    } catch (e) {
      setError(api.errorText(e, "Failed to raise COD dispute"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={`COD dispute · ${row.deliveryBoyName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
          <button type="button" disabled={busy} onClick={submit} className={btn.danger}>{busy ? "Submitting…" : "Raise Dispute"}</button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">{row.vendorName} · outstanding <b>{npr(row.outstanding)}</b></p>
        <label className="block"><span className={fieldLabel}>Disputed amount (NPR) *</span><input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} /></label>
        <label className="block"><span className={fieldLabel}>Reason *</span><input className={field} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Short handover on 3 orders" /></label>
        <label className="block"><span className={fieldLabel}>Notes</span><textarea className={`${field} h-20 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
