"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, HardDrive, Images, Search, Settings2, XCircle } from "lucide-react";
import * as api from "@/lib/admin/api";
import type { StorageRechargeRow, StorageVendorRow } from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, StatCard, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";

// Super admin only — backend: /api/admin/storage/* (routes/storageRoutes.js)

const GB = 1024 ** 3;
function bytes(n = 0) {
  if (n >= GB) return `${(n / GB).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(0, Math.round(n / 1024))} KB`;
}
const KIND_LABEL: Record<string, string> = { product: "Product photos", logo: "Store logo", qr: "Payment QR", brand: "Brand logos", other: "Other" };

function barTone(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 90) return "bg-orange-500";
  if (pct >= 80) return "bg-amber-400";
  return "bg-[#0284C7]";
}
function UsageBar({ used, quota, className = "", neutral = false }: { used: number; quota: number; className?: string; neutral?: boolean }) {
  const pct = quota > 0 ? Math.min(100, (used / quota) * 100) : 100;
  return (
    <div className={`h-2 rounded-full bg-slate-100 overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${neutral ? "bg-sky-300" : barTone(pct)}`} style={{ width: `${Math.max(pct, used > 0 ? 1 : 0)}%` }} />
    </div>
  );
}
function PctBadge({ pct }: { pct: number }) {
  const cls = pct >= 100 ? "bg-red-50 text-red-700" : pct >= 80 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{pct >= 100 ? "Full" : `${pct.toFixed(1)}%`}</span>;
}

const VIEWS = [
  { key: "vendors", label: "Vendor Usage" },
  { key: "recharges", label: "Recharge Requests" },
] as const;
const FILTERS = [
  { key: "all", label: "All vendors" },
  { key: "near", label: "Above 80%" },
  { key: "full", label: "Full" },
] as const;
const RECHARGE_STATUSES = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "ALL", label: "All" },
] as const;

export default function VendorStoragePage() {
  const [view, setView] = useState<(typeof VIEWS)[number]["key"]>("vendors");
  useEffect(() => {
    const open = () => {
      if (new URLSearchParams(window.location.search).get("tab") === "recharges") setView("recharges");
    };
    open();
    window.addEventListener("bhansa:open-storage-recharges", open);
    return () => window.removeEventListener("bhansa:open-storage-recharges", open);
  }, []);
  const [notice, setNotice] = useState<string | null>(null);
  const totalsQ = useAsync(() => api.getStorageVendors({ limit: 1 }), "storage-totals");
  const t = totalsQ.data?.totals;

  return (
    <>
      <PageHeader title="Vendor Storage" subtitle="Image storage used by each vendor, their limits and storage recharge requests" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Used" value={t ? bytes(t.usedBytes) : "—"} sub={t ? `${t.assets} images · default limit ${bytes(t.defaultQuotaBytes)}` : undefined} icon={HardDrive} />
          <StatCard label="Near Limit (≥80%)" value={t?.nearLimit ?? "—"} sub={t ? `of ${t.vendors} vendors` : undefined} icon={AlertTriangle} tone="amber" />
          <StatCard label="Storage Full" value={t?.full ?? "—"} sub="uploads blocked" icon={XCircle} tone="red" />
          <StatCard label="Pending Recharges" value={t?.pendingRecharges ?? "—"} sub="awaiting your verification" icon={Clock} tone="violet" />
        </div>
        <p className="text-[11px] text-slate-500">Only images uploaded after storage tracking went live are counted. Older images are not included.</p>
        <Tabs tabs={VIEWS} active={view} onChange={setView} counts={{ recharges: t?.pendingRecharges }} />
        {notice && <SuccessBanner message={notice} />}
        {view === "vendors" ? (
          <VendorUsage onNotice={(m) => { setNotice(m); totalsQ.reload(); }} />
        ) : (
          <Recharges onNotice={(m) => { setNotice(m); totalsQ.reload(); window.dispatchEvent(new Event("bhansa:admin-storage-changed")); }} />
        )}
      </div>
    </>
  );
}

// ─── Vendor usage table ───────────────────────────────────────────────────
function VendorUsage({ onNotice }: { onNotice: (m: string) => void }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);
  const q = useAsync(() => api.getStorageVendors({ filter, search: search || undefined, page }), `${filter}|${search}|${page}`);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <Tabs tabs={FILTERS} active={filter} onChange={(k) => { setFilter(k); setPage(1); }} />
        <label className="relative md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} placeholder="Search vendor name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search vendors" />
        </label>
      </div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading vendor storage…" />
        ) : !q.data?.vendors.length ? (
          <EmptyState icon={HardDrive} title="No vendors found" text={filter === "all" ? undefined : "No vendor is in this range right now."} />
        ) : (
          <div className="divide-y divide-slate-100">
            {q.data.vendors.map((v) => (
              <VendorRow key={v.vendorId} v={v} onOpen={() => setOpenId(v.vendorId)} />
            ))}
          </div>
        )}
      </Card>
      {(q.data?.pages || 1) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline}>Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {q.data?.pages}</span>
          <button type="button" disabled={page >= (q.data?.pages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline}>Next</button>
        </div>
      )}
      {openId && (
        <VendorDetailModal
          vendorId={openId}
          onClose={() => setOpenId(null)}
          onChanged={(m) => { onNotice(m); q.reload(); }}
        />
      )}
    </>
  );
}

function VendorRow({ v, onOpen }: { v: StorageVendorRow; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="w-full text-left p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50 cursor-pointer">
      <div className="flex items-center gap-3 md:w-72 min-w-0">
        {v.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center font-extrabold shrink-0">{v.name.charAt(0).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 truncate">{v.name}</p>
          <p className="text-xs text-slate-500 truncate">{v.email || "—"}</p>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold text-slate-700">{bytes(v.usedBytes)} of {bytes(v.quotaBytes)}</span>
          <PctBadge pct={v.percent} />
        </div>
        <UsageBar used={v.usedBytes} quota={v.quotaBytes} />
      </div>
      <div className="md:w-28 text-xs text-slate-500 md:text-right">
        <span className="inline-flex items-center gap-1"><Images className="w-3.5 h-3.5" /> {v.assetCount} images</span>
      </div>
    </button>
  );
}

// ─── Vendor detail + change limit ─────────────────────────────────────────
function VendorDetailModal({ vendorId, onClose, onChanged }: { vendorId: string; onClose: () => void; onChanged: (m: string) => void }) {
  const q = useAsync(() => api.getVendorStorageDetail(vendorId), `storage-detail-${vendorId}`);
  const [editing, setEditing] = useState(false);
  const [quotaGb, setQuotaGb] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const d = q.data;

  const saveQuota = async () => {
    const n = Number(quotaGb);
    if (!Number.isFinite(n) || n < 0.1 || n > 10000) return setError("Enter a limit between 0.1 GB and 10000 GB.");
    if (!reason.trim()) return setError("Please give a reason for changing this vendor's storage limit.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.setVendorStorageQuota(vendorId, { quotaGb: n, reason: reason.trim() });
      setEditing(false);
      setReason("");
      q.reload();
      onChanged(r.message || "Storage limit updated.");
    } catch (e) {
      setError(api.errorText(e, "Failed to update storage limit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open wide title={d ? `${d.vendor.name} · Storage` : "Vendor Storage"} onClose={onClose}>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      {q.loading && !d ? (
        <LoadingBlock text="Loading…" />
      ) : d ? (
        <div className="space-y-5">
          <div>
            <div className="flex items-end justify-between gap-2 mb-2">
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{bytes(d.usage.usedBytes)}</p>
                <p className="text-xs text-slate-500">used of {bytes(d.usage.quotaBytes)} · {bytes(d.usage.freeBytes)} free · {d.usage.assetCount} images</p>
              </div>
              <PctBadge pct={d.usage.percent} />
            </div>
            <UsageBar used={d.usage.usedBytes} quota={d.usage.quotaBytes} className="h-3" />
          </div>

          {!editing ? (
            <button type="button" className={btn.outline} onClick={() => { setQuotaGb(String(Math.round((d.usage.quotaBytes / GB) * 100) / 100)); setEditing(true); setError(null); }}>
              <Settings2 className="w-4 h-4" /> Change storage limit
            </button>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50">
              <label className="block">
                <span className={fieldLabel}>New limit (GB)</span>
                <input type="number" min={0.1} step={0.5} className={field} value={quotaGb} onChange={(e) => setQuotaGb(e.target.value)} />
              </label>
              <label className="block">
                <span className={fieldLabel}>Reason * (shown to vendor)</span>
                <input className={field} value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Complimentary upgrade" />
              </label>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" className={btn.ghost} onClick={() => setEditing(false)}>Cancel</button>
                <button type="button" className={btn.primary} disabled={busy} onClick={saveQuota}>{busy ? "Saving…" : "Save limit"}</button>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Usage by type</h3>
            {d.breakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No tracked images yet.</p>
            ) : (
              <div className="space-y-2">
                {d.breakdown.map((b) => (
                  <div key={b.kind}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{KIND_LABEL[b.kind] || b.kind} · {b.count}</span>
                      <span className="text-slate-500">{bytes(b.bytes)}</span>
                    </div>
                    <UsageBar used={b.bytes} quota={Math.max(d.usage.usedBytes, 1)} neutral />
                  </div>
                ))}
              </div>
            )}
          </section>

          {d.largest.length > 0 && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Largest images</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {d.largest.slice(0, 10).map((a) => (
                  <a key={a._id} href={a.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 overflow-hidden hover:border-sky-300">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.url} alt="" className="w-full aspect-square object-cover bg-slate-100" loading="lazy" />
                    <p className="text-[10px] text-center text-slate-600 py-1">{bytes(a.bytes)}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Recharge history</h3>
            {d.recharges.length === 0 ? (
              <p className="text-sm text-slate-500">No recharge requests.</p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {d.recharges.map((r) => (
                  <div key={r._id} className="p-3 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{r.planName} · {r.currency} {r.amount}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(r.createdAt)}{r.paymentRef ? ` · Ref ${r.paymentRef}` : ""}</p>
                    </div>
                    <RechargeStatus status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

function RechargeStatus({ status }: { status: StorageRechargeRow["status"] }) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    PAID: "bg-amber-50 text-amber-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
  };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${map[status] || "bg-slate-100 text-slate-600"}`}>{status === "PAID" ? "PENDING" : status}</span>;
}

// ─── Recharge requests (mock payments — verify then approve) ──────────────
function Recharges({ onNotice }: { onNotice: (m: string) => void }) {
  const [status, setStatus] = useState<(typeof RECHARGE_STATUSES)[number]["key"]>("PENDING");
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState<{ r: StorageRechargeRow; action: "APPROVE" | "REJECT" } | null>(null);
  const q = useAsync(() => api.getStorageRecharges({ status, page }), `${status}|${page}`);

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        No payment gateway is connected yet. Vendors submit a payment reference: check the payment was received, then approve to add the storage.
      </div>
      <Tabs tabs={RECHARGE_STATUSES} active={status} onChange={(k) => { setStatus(k); setPage(1); }} />
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading recharge requests…" />
        ) : !q.data?.recharges.length ? (
          <EmptyState icon={Clock} title={status === "PENDING" ? "No pending recharge requests" : "No recharge requests"} />
        ) : (
          <div className="divide-y divide-slate-100">
            {q.data.recharges.map((r) => {
              const pending = r.status === "PENDING" || r.status === "PAID";
              return (
                <div key={r._id} className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">{r.vendorName || "Store"}</span>
                      <RechargeStatus status={r.status} />
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {r.planName} (+{bytes(r.extraBytes)}) · <b>{r.currency} {r.amount}</b>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDateTime(r.createdAt)} · Payment ref: <span className="font-semibold text-slate-700">{r.paymentRef || "not given"}</span>
                    </p>
                    {r.vendorNote && <p className="text-xs text-slate-600 mt-1">Vendor note: {r.vendorNote}</p>}
                    {!pending && (
                      <p className="text-xs text-slate-500 mt-1">
                        {r.status === "APPROVED" ? "Approved" : "Rejected"}
                        {r.reviewedBy?.name ? ` by ${r.reviewedBy.name}` : ""}
                        {r.reviewedAt ? ` · ${formatDateTime(r.reviewedAt)}` : ""}
                        {r.status === "APPROVED" && r.quotaAfter ? ` · limit ${bytes(r.quotaBefore || 0)} → ${bytes(r.quotaAfter)}` : ""}
                        {r.adminNote ? ` · ${r.adminNote}` : ""}
                      </p>
                    )}
                  </div>
                  {pending && (
                    <div className="flex gap-2">
                      <button type="button" className={`${btn.danger} h-9`} onClick={() => setReviewing({ r, action: "REJECT" })}><XCircle className="w-4 h-4" /> Reject</button>
                      <button type="button" className={`${btn.success} h-9`} onClick={() => setReviewing({ r, action: "APPROVE" })}><CheckCircle2 className="w-4 h-4" /> Approve</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {(q.data?.pages || 1) > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline}>Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {q.data?.pages}</span>
          <button type="button" disabled={page >= (q.data?.pages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline}>Next</button>
        </div>
      )}
      {reviewing && (
        <ReviewModal
          r={reviewing.r}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={(m) => { setReviewing(null); onNotice(m); q.reload(); }}
        />
      )}
    </>
  );
}

function ReviewModal({ r, action, onClose, onDone }: { r: StorageRechargeRow; action: "APPROVE" | "REJECT"; onClose: () => void; onDone: (m: string) => void }) {
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const approve = action === "APPROVE";
  const submit = async () => {
    if (!approve && !note.trim()) return setError("Please give a reason for rejecting this recharge.");
    if (approve && !verified) return setError("Tick the box to confirm you have checked the payment was received.");
    setBusy(true);
    setError(null);
    try {
      const res = await api.reviewStorageRecharge(r._id, { action, note: note.trim() || undefined, paymentVerified: approve ? verified : undefined });
      onDone(res.message || (approve ? "Recharge approved." : "Recharge rejected."));
    } catch (e) {
      setError(api.errorText(e, "Failed to review recharge"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      title={approve ? "Approve storage recharge" : "Reject storage recharge"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
          <button type="button" disabled={busy || (approve && !verified)} onClick={submit} className={approve ? btn.success : btn.dangerSolid}>
            {busy ? "Saving…" : approve ? `Approve +${bytes(r.extraBytes)}` : "Reject"}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
          <p><span className="text-slate-500">Vendor:</span> <b>{r.vendorName || "Store"}</b></p>
          <p><span className="text-slate-500">Plan:</span> {r.planName} (+{bytes(r.extraBytes)})</p>
          <p><span className="text-slate-500">Amount:</span> <b>{r.currency} {r.amount}</b></p>
          <p><span className="text-slate-500">Payment ref:</span> {r.paymentRef || "not given"}</p>
        </div>
        {approve && (
          <label className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer ${verified ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-emerald-600" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
            <span className="text-xs text-slate-800">
              <b>I have checked that {r.currency} {r.amount} was received</b> in BhansaMart&apos;s account{r.paymentRef ? <> with reference <b>{r.paymentRef}</b></> : ""}. The vendor&apos;s limit increases immediately and this approval is recorded in the audit log.
            </span>
          </label>
        )}
        <label className="block">
          <span className={fieldLabel}>{approve ? "Note (optional)" : "Reason *"}</span>
          <textarea className={`${field} h-20 py-2`} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder={approve ? "" : "e.g. Payment not received"} />
        </label>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      </div>
    </Modal>
  );
}
