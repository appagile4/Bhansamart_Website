"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Ticket } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AdminTicket } from "@/lib/admin/types";
import { formatDateTime } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, Tabs, btn, field, fieldLabel } from "@/components/admin/ui";

// app: Screens/adminScreens/tickets.tsx
const FILTERS = [
  { key: "", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
] as const;
const NEXT_STATUSES = ["IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const statusCls = (s: string) =>
  s === "OPEN" ? "bg-red-50 text-red-700" : s === "IN_PROGRESS" || s === "ASSIGNED" ? "bg-amber-50 text-amber-700" : s === "RESOLVED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
const priorityCls = (p?: string) => (p === "critical" ? "text-red-700" : p === "high" ? "text-orange-600" : p === "medium" ? "text-amber-600" : "text-slate-500");
const raiser = (t: AdminTicket) => (t.raisedBy && typeof t.raisedBy === "object" ? t.raisedBy : null);

export default function TicketsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const q = useAsync(() => api.getTickets({ status: filter || undefined, limit: 100 }), `tickets-${filter}`);
  const list = q.data?.data || [];

  return (
    <>
      <PageHeader title="Support Tickets" subtitle={`${q.data?.total ?? 0} tickets from customers, vendors and riders`} />
      <div className="space-y-4">
        <Tabs tabs={FILTERS} active={filter} onChange={setFilter} />
        {notice && <SuccessBanner message={notice} />}
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        <div className="bg-white rounded-2xl border border-slate-100">
          {q.loading && !q.data ? (
            <LoadingBlock text="Loading tickets…" />
          ) : list.length === 0 ? (
            <EmptyState icon={Ticket} title="No tickets" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((t) => (
                <li key={t._id}>
                  <button type="button" onClick={() => setOpenId(t._id)} className="w-full text-left p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center gap-2 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{t.ticketNumber || `#${t._id.slice(-6)}`}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls(t.status)}`}>{t.status.replace(/_/g, " ")}</span>
                        <span className={`text-[10px] font-bold uppercase ${priorityCls(t.priority)}`}>{t.priority}</span>
                        {t.category && <span className="text-[10px] font-semibold text-slate-500 capitalize">{t.category.replace(/_/g, " ")}</span>}
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-1 truncate">{t.subject}</p>
                      <p className="text-xs text-slate-500 truncate">{raiser(t)?.name || "User"} ({t.userRole || raiser(t)?.role || "—"}){t.description ? ` · ${t.description}` : ""}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{formatDateTime(t.updatedAt || t.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {openId && (
        <TicketModal
          id={openId}
          onClose={() => setOpenId(null)}
          onReplied={(m) => {
            setNotice(m);
            q.reload();
          }}
        />
      )}
    </>
  );
}

function TicketModal({ id, onClose, onReplied }: { id: string; onClose: () => void; onReplied: (m: string) => void }) {
  const q = useAsync(() => api.getTicket(id), `ticket-${id}`);
  const t = q.data;
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = status ?? (t ? (t.status === "OPEN" ? "IN_PROGRESS" : t.status) : "IN_PROGRESS");

  const send = async () => {
    if (!message.trim()) return setError("Write a reply first.");
    setBusy(true);
    setError(null);
    try {
      await api.replyTicket(id, { message: message.trim(), status: next });
      setMessage("");
      onReplied("Reply sent.");
      q.reload();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open wide title={t ? t.subject : "Ticket"} onClose={onClose}>
      {q.loading && !t ? (
        <LoadingBlock />
      ) : !t ? (
        <ErrorBanner message={q.error || "Ticket not found."} onRetry={q.reload} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-bold ${statusCls(t.status)}`}>{t.status.replace(/_/g, " ")}</span>
            <span className={`font-bold uppercase ${priorityCls(t.priority)}`}>{t.priority}</span>
            <span className="text-slate-500">{raiser(t)?.name} · {raiser(t)?.email} {raiser(t)?.phone ? `· ${raiser(t)?.phone}` : ""}</span>
            {t.order && typeof t.order === "object" && <span className="text-slate-500">Order {t.order.orderNumber}</span>}
            {t.vendor && typeof t.vendor === "object" && <span className="text-slate-500">Store {t.vendor.businessDetails?.businessName}</span>}
          </div>
          {t.description && <p className="text-sm text-slate-700 whitespace-pre-line rounded-xl bg-slate-50 p-3">{t.description}</p>}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {(t.messages || []).length === 0 ? (
              <p className="text-xs text-slate-400 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> No replies yet.</p>
            ) : (
              t.messages!.map((m, i) => {
                const staff = ["admin", "superadmin"].includes(m.senderRole || "");
                return (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${staff ? "ml-auto bg-sky-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    <p className="whitespace-pre-line">{m.message}</p>
                    <p className={`text-[10px] mt-1 ${staff ? "text-sky-100" : "text-slate-500"}`}>
                      {typeof m.sender === "object" ? m.sender?.name : ""} · {m.senderRole} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          {t.status !== "CLOSED" && (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className={fieldLabel}>Reply & set status</span>
              <div className="flex gap-2">
                {NEXT_STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={next === s} className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${next === s ? "bg-sky-700 border-sky-700 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
              <textarea className={`${field} h-24 py-2`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your response…" aria-label="Reply message" />
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex justify-end">
                <button type="button" disabled={busy} onClick={send} className={btn.primary}><Send className="w-4 h-4" /> {busy ? "Sending…" : "Send Reply"}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
