"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, History, Lock, Megaphone, Search, Send, Store, Users, X } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";
import { Pager } from "@/components/admin/StaffAlerts";

// app: staffadminScreens/BroadcastNotificationScreen.tsx — vendor broadcasts with permission-based targeting
const MAIN_TABS = [
  { key: "compose", label: "Compose" },
  { key: "history", label: "History" },
] as const;

const TYPES = [
  { key: "ANNOUNCEMENT", label: "Announcement" },
  { key: "GENERAL", label: "General" },
  { key: "IMPORTANT_NOTICE", label: "Important Notice" },
  { key: "ORDER_UPDATE", label: "Order Update" },
  { key: "PROMOTION", label: "Promotion" },
] as const;

const TARGET_LABEL: Record<api.BroadcastTarget, string> = {
  ASSIGNED_VENDORS: "Assigned Stores",
  SPECIFIC_VENDORS: "Specific Vendors",
  ALL_VENDORS: "All Vendors",
};

export default function StaffBroadcastsPage() {
  const [tab, setTab] = useState<(typeof MAIN_TABS)[number]["key"]>("compose");
  return (
    <>
      <PageHeader title="Vendor Broadcast Notifications" subtitle="Announcements, alerts & urgent notices to vendor stores" />
      <div className="space-y-4">
        <Tabs tabs={MAIN_TABS} active={tab} onChange={setTab} />
        {tab === "compose" ? <Compose onSent={() => setTab("history")} /> : <HistoryTab />}
      </div>
    </>
  );
}

function Compose({ onSent }: { onSent: () => void }) {
  const perms = useAsync(() => api.getBroadcastPermissions(), "bc-perms");
  const p = perms.data;
  const allowed = useMemo(() => {
    if (!p) return [] as api.BroadcastTarget[];
    const list: api.BroadcastTarget[] = [];
    if (p.isSuperAdmin || p.canBroadcastToAssignedVendors) list.push("ASSIGNED_VENDORS");
    if (p.isSuperAdmin || p.canBroadcastToSpecificVendors) list.push("SPECIFIC_VENDORS");
    if (p.isSuperAdmin || p.canBroadcastToAllVendors) list.push("ALL_VENDORS");
    return list;
  }, [p]);

  const [target, setTarget] = useState<api.BroadcastTarget | null>(null);
  const activeTarget = target && allowed.includes(target) ? target : allowed[0] || null;
  const [type, setType] = useState<string>("ANNOUNCEMENT");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [picked, setPicked] = useState<api.BroadcastVendor[]>([]);
  const [picking, setPicking] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const pickedIds = picked.map((v) => v._id).join(",");
  // Live recipient count (app: recipient-preview)
  useEffect(() => {
    if (!activeTarget || (activeTarget === "SPECIFIC_VENDORS" && !pickedIds)) {
      const t = setTimeout(() => setPreview(activeTarget ? 0 : null), 0);
      return () => clearTimeout(t);
    }
    let alive = true;
    const t = setTimeout(() => {
      api
        .getBroadcastRecipientPreview(activeTarget, activeTarget === "SPECIFIC_VENDORS" ? pickedIds.split(",") : undefined)
        .then((n) => alive && setPreview(n))
        .catch(() => alive && setPreview(null));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [activeTarget, pickedIds]);

  const review = () => {
    setSent(null);
    if (!title.trim()) return setError("Please enter a notification title.");
    if (!message.trim()) return setError("Please enter the notification message body.");
    if (activeTarget === "SPECIFIC_VENDORS" && !picked.length) return setError("Please select at least one vendor to target.");
    setError(null);
    setConfirming(true);
  };

  const send = async () => {
    if (!activeTarget) return;
    setSending(true);
    try {
      const r = await api.sendVendorBroadcast({
        title: title.trim(),
        message: message.trim(),
        targetType: activeTarget,
        vendorIds: activeTarget === "SPECIFIC_VENDORS" ? picked.map((v) => v._id) : undefined,
        notificationType: type,
        imageUrl: imageUrl.trim() || undefined,
        idempotencyKey: `broadcast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      });
      setConfirming(false);
      setSent(r.message || "Notification was successfully sent to the selected vendor audience.");
      setTitle("");
      setMessage("");
      setImageUrl("");
      setPicked([]);
    } catch (e) {
      setConfirming(false);
      setError(api.errorText(e, "An error occurred while sending the broadcast."));
    } finally {
      setSending(false);
    }
  };

  if (perms.loading && !p) return <LoadingBlock text="Checking broadcast permissions…" />;
  if (perms.error) return <ErrorBanner message={perms.error} onRetry={perms.reload} />;
  if (!allowed.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100">
        <EmptyState icon={Lock} title="Broadcasting not authorized" text="You do not have authorization to send vendor broadcast notifications. Please contact your Super Administrator to configure your notification targeting scope." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <Card title="Compose broadcast">
        <div className="p-5 space-y-5">
          {sent && (
            <div className="space-y-2">
              <SuccessBanner message={sent} />
              <button type="button" onClick={onSent} className={`${btn.ghost} h-8 text-xs`}><History className="w-3.5 h-3.5" /> View history</button>
            </div>
          )}
          <div>
            <p className={fieldLabel}>1. Target audience scope</p>
            <p className="text-[11px] text-slate-500 mb-2">Options configured and authorized by the super admin.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Target audience">
              {allowed.map((t) => {
                const on = activeTarget === t;
                const Icon = t === "ASSIGNED_VENDORS" ? Store : t === "SPECIFIC_VENDORS" ? Search : Users;
                return (
                  <button key={t} type="button" role="radio" aria-checked={on} onClick={() => setTarget(t)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer ${on ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <Icon className="w-4 h-4" /> {TARGET_LABEL[t]}
                  </button>
                );
              })}
            </div>
            {activeTarget === "SPECIFIC_VENDORS" && (
              <div className="mt-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">{picked.length} vendor(s) selected</span>
                  <button type="button" onClick={() => setPicking(true)} className={`${btn.outline} h-8 text-xs`}>Select vendors</button>
                </div>
                {!!picked.length && (
                  <ul className="flex flex-wrap gap-1.5 mt-2">
                    {picked.map((v) => (
                      <li key={v._id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-sky-50 text-xs font-semibold text-sky-800">
                        {v.businessName || v.sellerName || "Store"}
                        <button type="button" onClick={() => setPicked((l) => l.filter((x) => x._id !== v._id))} className="p-0.5 rounded-full hover:bg-sky-100 cursor-pointer" aria-label={`Remove ${v.businessName || "store"}`}><X className="w-3 h-3" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <p className={fieldLabel}>2. Notification type</p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t.key} type="button" aria-pressed={type === t.key} onClick={() => setType(t.key)} className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer ${type === t.key ? "bg-sky-700 border-sky-700 text-white" : "border-slate-200 text-slate-600"}`}>{t.label}</button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={fieldLabel}>3. Title *</span>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="e.g., Important Store Operation Update" />
            <span className="block text-right text-[10px] text-slate-400">{title.length}/150</span>
          </label>
          <label className="block">
            <span className={fieldLabel}>4. Message *</span>
            <textarea className={`${field} h-32 py-2`} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder="Type the announcement or notice message for vendors…" />
            <span className="block text-right text-[10px] text-slate-400">{message.length}/2000</span>
          </label>
          <label className="block">
            <span className={fieldLabel}>Banner image URL (optional)</span>
            <input className={field} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://… (optional banner image for notice)" />
          </label>
          {error && <p className="text-xs text-red-600 font-medium" role="alert">{error}</p>}
          <button type="button" onClick={review} className={`${btn.primary} w-full`}><Send className="w-4 h-4" /> Send Broadcast</button>
        </div>
      </Card>

      <Card title="Delivery summary">
        <div className="p-5 space-y-3 text-sm">
          <div className="rounded-xl bg-sky-50 p-4 text-center">
            <p className="text-3xl font-extrabold text-sky-800">{preview ?? "—"}</p>
            <p className="text-xs text-sky-900/70">vendor store(s) will receive this</p>
          </div>
          <p className="text-xs text-slate-600">Audience: <span className="font-bold">{activeTarget ? TARGET_LABEL[activeTarget] : "—"}</span></p>
          <p className="text-xs text-slate-600">Type: <span className="font-bold">{TYPES.find((t) => t.key === type)?.label}</span></p>
          {type === "IMPORTANT_NOTICE" && <p className="text-[11px] text-red-600 font-semibold">Important notices are delivered with high priority.</p>}
        </div>
      </Card>

      {picking && <VendorPicker initial={picked} onClose={() => setPicking(false)} onDone={(l) => { setPicked(l); setPicking(false); }} />}

      <Modal
        open={confirming}
        title="Confirm broadcast"
        onClose={() => !sending && setConfirming(false)}
        footer={
          <>
            <button type="button" onClick={() => setConfirming(false)} disabled={sending} className={btn.ghost}>Cancel</button>
            <button type="button" onClick={send} disabled={sending} className={btn.primary}>{sending ? "Sending…" : "Send Now"}</button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Send “<span className="font-bold">{title.trim()}</span>” to <span className="font-bold">{activeTarget ? TARGET_LABEL[activeTarget] : ""}</span>
          {preview != null ? ` (${preview} store${preview === 1 ? "" : "s"})` : ""}?
        </p>
      </Modal>
    </div>
  );
}

function VendorPicker({ initial, onClose, onDone }: { initial: api.BroadcastVendor[]; onClose: () => void; onDone: (l: api.BroadcastVendor[]) => void }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<api.BroadcastVendor[]>(initial);
  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);
  const q = useAsync(() => api.getBroadcastEligibleVendors({ search: search || undefined }), search);
  const isOn = (id: string) => sel.some((v) => v._id === id);
  const toggle = (v: api.BroadcastVendor) => setSel((l) => (isOn(v._id) ? l.filter((x) => x._id !== v._id) : [...l, v]));

  return (
    <Modal
      open
      wide
      title="Select vendors"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.ghost}>Cancel</button>
          <button type="button" onClick={() => onDone(sel)} className={btn.primary}>Done ({sel.length})</button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search by store or owner name…" aria-label="Search vendors" autoFocus />
        </div>
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading vendors…" />
        ) : !q.data?.vendors.length ? (
          <EmptyState icon={Store} title="No eligible vendors" />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 max-h-80 overflow-y-auto">
            {q.data.vendors.map((v) => {
              const on = isOn(v._id);
              return (
                <li key={v._id}>
                  <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(v)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 cursor-pointer">
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-sky-700 border-sky-700 text-white" : "border-slate-300"}`}>{on && <Check className="w-3.5 h-3.5" />}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-slate-800 truncate">{v.businessName || "Store"}</span>
                      <span className="block text-[11px] text-slate-500 truncate">{[v.sellerName, v.sellerPhone].filter(Boolean).join(" · ")}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

const HISTORY_FILTERS = [
  { key: "ALL", label: "All Audiences" },
  { key: "ASSIGNED_VENDORS", label: "Assigned" },
  { key: "SPECIFIC_VENDORS", label: "Specific" },
  { key: "ALL_VENDORS", label: "Platform-Wide" },
] as const;

function HistoryTab() {
  const [filter, setFilter] = useState<(typeof HISTORY_FILTERS)[number]["key"]>("ALL");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);
  const q = useAsync(() => api.getVendorBroadcastHistory({ page, targetType: filter, search: search || undefined }), `${filter}|${search}|${page}`);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <Tabs tabs={HISTORY_FILTERS} active={filter} onChange={(k) => { setFilter(k); setPage(1); }} />
        <div className="relative md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search history by title or sender…" aria-label="Search broadcast history" />
        </div>
      </div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading history…" />
        ) : !q.data?.broadcasts.length ? (
          <EmptyState icon={History} title="No broadcasts yet" text="Broadcasts you send appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {q.data.broadcasts.map((b) => (
              <li key={b._id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4" /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{b.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">{TARGET_LABEL[b.targetType] || b.targetType}</span>
                    {b.status && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === "SENT" ? "bg-emerald-50 text-emerald-700" : b.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{b.status}</span>}
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">{b.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{b.recipientCount ?? 0} recipients · by {b.senderName || b.sender?.name || "Admin"} · {formatDateTime(b.sentAt || b.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Pager page={page} pages={q.data?.pages || 1} onPage={setPage} />
    </div>
  );
}
