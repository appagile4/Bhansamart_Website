"use client";

import React, { useEffect, useState } from "react";
import { Bell, Bike, History, Megaphone, RotateCcw, Search, Send, ShieldCheck, Store, User, Users, X } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime, timeAgo } from "@/lib/seller/format";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";
import StaffAlerts, { Pager } from "@/components/admin/StaffAlerts";

// app: Screens/adminScreens/notifications.tsx — Operational Alerts · Send Broadcast · History
const MAIN_TABS = [
  { key: "alerts", label: "Operational Alerts" },
  { key: "broadcast", label: "Send Broadcast" },
  { key: "history", label: "Broadcast History" },
] as const;
type MainTab = (typeof MAIN_TABS)[number]["key"];

const AUDIENCES = [
  { key: "ALL", label: "Everyone (All Users)", icon: Megaphone },
  { key: "CUSTOMERS", label: "Customers Only", icon: Users },
  { key: "VENDORS", label: "Vendors Only", icon: Store },
  { key: "DELIVERY_BOYS", label: "Delivery Boys Only", icon: Bike },
  { key: "ADMIN_STAFF", label: "Staff Admins Only", icon: ShieldCheck },
  { key: "SPECIFIC", label: "Specific User", icon: Search },
] as const;
type Audience = (typeof AUDIENCES)[number]["key"];
const ROLES = [
  { key: "customer", label: "Customer" },
  { key: "vendor", label: "Vendor" },
  { key: "delivery_boy", label: "Delivery Boy" },
  { key: "admin", label: "Staff Admin" },
] as const;
type Role = (typeof ROLES)[number]["key"];

const audienceBadge = (a?: string, role?: string) => {
  switch (a) {
    case "CUSTOMERS":
      return { label: "CUSTOMERS", cls: "bg-sky-50 text-sky-700" };
    case "VENDORS":
      return { label: "VENDORS", cls: "bg-amber-50 text-amber-700" };
    case "DELIVERY_BOYS":
      return { label: "DELIVERY BOYS", cls: "bg-emerald-50 text-emerald-700" };
    case "ADMIN_STAFF":
      return { label: "STAFF ADMIN", cls: "bg-violet-50 text-violet-700" };
    case "SPECIFIC":
      return { label: `DIRECT ${role ? role.replace("_", " ").toUpperCase() : "USER"}`, cls: "bg-rose-50 text-rose-700" };
    default:
      return { label: "ALL USERS", cls: "bg-slate-100 text-slate-700" };
  }
};

interface Draft {
  title: string;
  body: string;
  deepLink: string;
  audience: Audience;
}
const EMPTY_DRAFT: Draft = { title: "", body: "", deepLink: "", audience: "ALL" };

export default function NotificationsPage() {
  const [tab, setTab] = useState<MainTab>("alerts");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const reuse = (d: Draft) => {
    setDraft(d);
    setTab("broadcast");
  };
  return (
    <>
      <PageHeader title="Broadcast Notifications" subtitle="Operational alerts and targeted push notifications" />
      <div className="space-y-4">
        <Tabs tabs={MAIN_TABS} active={tab} onChange={setTab} />
        {tab === "alerts" && <StaffAlerts />}
        {tab === "broadcast" && <BroadcastTab draft={draft} setDraft={setDraft} onViewHistory={() => setTab("history")} />}
        {tab === "history" && <HistoryTab onReuse={reuse} />}
      </div>
    </>
  );
}

/* ─── Send broadcast ─────────────────────────────────────────────────── */

function BroadcastTab({ draft, setDraft, onViewHistory }: { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; onViewHistory: () => void }) {
  const [role, setRole] = useState<Role>("customer");
  const [recipient, setRecipient] = useState<api.NotificationRecipient | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<api.NotificationRecipient[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // Debounced recipient search (app: 300ms)
  useEffect(() => {
    if (draft.audience !== "SPECIFIC") return;
    let alive = true;
    const t = setTimeout(() => {
      setSearching(true);
      api
        .searchRecipients(role, search.trim())
        .then((r) => alive && setResults(r))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setSearching(false));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [draft.audience, role, search]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const audienceLabel = draft.audience === "SPECIFIC" && recipient ? `${recipient.name} (${recipient.role.toUpperCase()})` : AUDIENCES.find((a) => a.key === draft.audience)?.label || draft.audience;

  const review = () => {
    setSent(null);
    if (!draft.title.trim() || !draft.body.trim()) return setError("Please provide both headline/title and message body.");
    if (draft.audience === "SPECIFIC" && !recipient) return setError("Please search and select a specific recipient to dispatch this notification.");
    setError(null);
    setConfirming(true);
  };

  const send = async () => {
    setSending(true);
    try {
      const link = draft.deepLink.trim();
      const r = await api.sendBroadcast({
        targetAudience: draft.audience,
        targetRole: draft.audience === "SPECIFIC" ? role : undefined,
        targetId: draft.audience === "SPECIFIC" ? recipient?.id : undefined,
        title: draft.title.trim(),
        body: draft.body.trim(),
        deepLink: link || undefined,
        data: link ? { screen: link } : {},
      });
      setConfirming(false);
      setSent(`Delivered notification to ${r.data?.recipientCount ?? "all active"} account(s) via real-time socket and in-app feed.`);
      setDraft(EMPTY_DRAFT);
      setRecipient(null);
      setSearch("");
    } catch (e) {
      setConfirming(false);
      setError(api.errorText(e, "Failed to broadcast notification"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
      <Card title="Compose notification">
        <div className="p-5 space-y-5">
          {sent && (
            <div className="space-y-2">
              <SuccessBanner message={sent} />
              <button type="button" onClick={onViewHistory} className={`${btn.ghost} h-8 text-xs`}><History className="w-3.5 h-3.5" /> View in history</button>
            </div>
          )}
          <div>
            <p className={fieldLabel}>Target audience</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2" role="radiogroup" aria-label="Target audience">
              {AUDIENCES.map((a) => {
                const on = draft.audience === a.key;
                return (
                  <button key={a.key} type="button" role="radio" aria-checked={on} onClick={() => set("audience", a.key)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left cursor-pointer ${on ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <a.icon className="w-4 h-4 shrink-0" /> {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {draft.audience === "SPECIFIC" && (
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <Tabs tabs={ROLES} active={role} onChange={(k) => { setRole(k); setRecipient(null); }} />
              {recipient ? (
                <div className="flex items-center gap-3 rounded-xl bg-sky-50 border border-sky-200 px-3 py-2">
                  <User className="w-4 h-4 text-sky-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{recipient.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{[recipient.phone, recipient.email].filter(Boolean).join(" · ")}</p>
                  </div>
                  <button type="button" onClick={() => setRecipient(null)} className="p-1 rounded text-slate-500 hover:bg-white cursor-pointer" aria-label="Clear recipient"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${ROLES.find((r) => r.key === role)?.label.toLowerCase()} by name, phone or email…`} aria-label="Search recipients" />
                  </div>
                  <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100">
                    {searching && !results.length ? (
                      <li className="px-3 py-3 text-xs text-slate-500">Searching…</li>
                    ) : !results.length ? (
                      <li className="px-3 py-3 text-xs text-slate-500">No matching accounts.</li>
                    ) : (
                      results.map((r) => (
                        <li key={r.id}>
                          <button type="button" onClick={() => setRecipient(r)} className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer">
                            <span className="block text-sm font-semibold text-slate-800">{r.name}</span>
                            <span className="block text-[11px] text-slate-500">{[r.phone, r.email].filter(Boolean).join(" · ")}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          <label className="block">
            <span className={fieldLabel}>Headline / title *</span>
            <input className={field} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="e.g. Flash Sale: 20% Off Fresh Vegetables Today!" />
          </label>
          <label className="block">
            <span className={fieldLabel}>Message body *</span>
            <textarea className={`${field} h-28 py-2`} value={draft.body} onChange={(e) => set("body", e.target.value)} maxLength={500} placeholder="Write the full broadcast message content…" />
            <span className="block text-right text-[10px] text-slate-400">{draft.body.length}/500</span>
          </label>
          <label className="block">
            <span className={fieldLabel}>Open screen on tap (optional deep link)</span>
            <input className={field} value={draft.deepLink} onChange={(e) => set("deepLink", e.target.value)} placeholder="e.g. /(tabs)/home or /Screens/customerScreens/offers" />
            <span className="block text-[10px] text-slate-400 mt-1">App route the notification opens when tapped.</span>
          </label>
          {error && <ErrorBanner message={error} />}
          <button type="button" onClick={review} className={`${btn.primary} w-full`}><Send className="w-4 h-4" /> Send Notification</button>
        </div>
      </Card>

      <Card title="Preview">
        <div className="p-5">
          <div className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
              <span className="w-4 h-4 rounded bg-sky-600 flex items-center justify-center"><Bell className="w-2.5 h-2.5" /></span>
              BhansaMart · now
            </div>
            <p className="text-sm font-bold break-words">{draft.title || "Notification title"}</p>
            <p className="text-xs text-slate-300 mt-0.5 break-words whitespace-pre-line">{draft.body || "Your message will appear here."}</p>
          </div>
          <p className="mt-3 text-xs text-slate-500">Sending to: <span className="font-bold text-slate-700">{audienceLabel}</span></p>
        </div>
      </Card>

      <Modal
        open={confirming}
        title="Confirm notification dispatch"
        onClose={() => !sending && setConfirming(false)}
        footer={
          <>
            <button type="button" onClick={() => setConfirming(false)} disabled={sending} className={btn.ghost}>Cancel</button>
            <button type="button" onClick={send} disabled={sending} className={btn.primary}>{sending ? "Sending…" : "Send Now"}</button>
          </>
        }
      >
        <p className="text-sm text-slate-700">Are you sure you want to send this notification to <span className="font-bold">“{audienceLabel}”</span>?</p>
      </Modal>
    </div>
  );
}

/* ─── History ────────────────────────────────────────────────────────── */

function HistoryTab({ onReuse }: { onReuse: (d: Draft) => void }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<api.BroadcastHistoryItem | null>(null);
  // Debounced search (app: 400ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [input]);
  const q = useAsync(() => api.getBroadcastHistory({ page, search: search || undefined }), `${search}|${page}`);

  return (
    <div className="space-y-3">
      <div className="relative md:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${field} pl-9`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search history by title, content or admin…" aria-label="Search broadcast history" />
      </div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading history…" />
        ) : !q.data?.history.length ? (
          <EmptyState icon={History} title="No broadcasts yet" text="Notifications you send appear here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {q.data.history.map((h, i) => {
              const b = audienceBadge(h.targetAudience, h.targetRole);
              return (
                <li key={h._id || h.id || i}>
                  <button type="button" onClick={() => setSelected(h)} className="w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 cursor-pointer">
                    <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">{h.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.cls}`}>{b.label}</span>
                      </span>
                      <span className="block text-xs text-slate-600 line-clamp-2">{h.body}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{h.recipientCount ?? 0} recipients · by {h.senderName || "Admin"} · {timeAgo(h.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Pager page={page} pages={q.data?.pages || 1} onPage={setPage} />

      {selected && (
        <Modal
          open
          wide
          title="Broadcast details"
          onClose={() => setSelected(null)}
          footer={
            <>
              <button type="button" onClick={() => setSelected(null)} className={btn.ghost}>Close</button>
              <button
                type="button"
                onClick={() => {
                  const aud = AUDIENCES.find((a) => a.key === selected.targetAudience && a.key !== "SPECIFIC")?.key || "ALL";
                  onReuse({ title: selected.title || "", body: selected.body || "", deepLink: selected.deepLink || "", audience: aud });
                }}
                className={btn.primary}
              >
                <RotateCcw className="w-4 h-4" /> Reuse as template
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <div>
              <p className="text-base font-extrabold text-slate-900">{selected.title}</p>
              <p className="text-sm text-slate-700 whitespace-pre-line mt-1">{selected.body}</p>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                ["Audience", audienceBadge(selected.targetAudience, selected.targetRole).label],
                ["Recipient", selected.recipientName || ""],
                ["Recipients reached", String(selected.recipientCount ?? 0)],
                ["Deep link", selected.deepLink || ""],
                ["Sent by", [selected.senderName, selected.senderRole].filter(Boolean).join(" · ")],
                ["Sent at", formatDateTime(selected.createdAt)],
                ["Source", selected.source === "VENDOR_BROADCAST" ? "Vendor broadcast" : "Targeted notification"],
              ] as Array<[string, string]>)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                    <dd className="text-sm font-semibold text-slate-800 break-words">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
}
