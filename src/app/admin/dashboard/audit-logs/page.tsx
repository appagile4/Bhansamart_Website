"use client";

import React, { useState } from "react";
import { FileText, Search } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { AuditLogEntry } from "@/lib/admin/types";
import { formatDateTime } from "@/lib/seller/format";
import { EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, btn, field } from "@/components/admin/ui";

// app: audit-logs.tsx getActionColor
const actionCls = (a: string) =>
  a.includes("CREATE") || a.includes("APPROVE") ? "bg-emerald-50 text-emerald-700" : a.includes("REJECT") || a.includes("DELETE") || a.includes("BLOCK") ? "bg-red-50 text-red-700" : a.includes("UPDATE") || a.includes("CONFIG") ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
const actorName = (l: AuditLogEntry) => l.actorName || (l.actor && typeof l.actor === "object" ? l.actor.name : "") || "System";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const q = useAsync(() => api.getAuditLogs({ page, limit: 50 }), `audit-${page}`);
  const s = search.trim().toLowerCase();
  const logs = (q.data?.data || []).filter((l) => !s || [actorName(l), l.actorEmail, l.action, l.targetResource].some((f) => (f || "").toLowerCase().includes(s)));

  return (
    <>
      <PageHeader title="Audit Logs" subtitle={`${q.data?.total ?? 0} recorded administrative actions`} />
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter audit records by actor or action…" aria-label="Filter audit logs" />
        </div>
        {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
        <div className="bg-white rounded-2xl border border-slate-100">
          {q.loading && !q.data ? (
            <LoadingBlock text="Loading audit logs…" />
          ) : logs.length === 0 ? (
            <EmptyState icon={FileText} title="No audit records" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map((l) => (
                <li key={l._id}>
                  <button type="button" onClick={() => setSelected(l)} className="w-full text-left p-4 hover:bg-slate-50 flex flex-col md:flex-row md:items-center gap-2 cursor-pointer">
                    <span className={`self-start px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide ${actionCls(l.action || "")}`}>{l.action || "LOGGED_ACTION"}</span>
                    <span className="flex-1 min-w-0 text-sm">
                      <span className="font-bold text-slate-900">{actorName(l)}</span>
                      <span className="text-slate-500"> ({l.actorRole || "—"}) · Resource </span>
                      <span className="font-semibold text-slate-800">{l.targetResource || "—"}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">{formatDateTime(l.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {(q.data?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={btn.outline}>Previous</button>
            <span className="text-sm text-slate-600">Page {page} of {q.data?.totalPages}</span>
            <button type="button" disabled={page >= (q.data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className={btn.outline}>Next</button>
          </div>
        )}
      </div>
      {selected && (
        <Modal open wide title={selected.action} onClose={() => setSelected(null)}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ["Actor", `${actorName(selected)}${selected.actorEmail ? ` · ${selected.actorEmail}` : ""}`],
              ["Role", selected.actorRole || "—"],
              ["Resource", selected.targetResource || "—"],
              ["Target ID", selected.targetId || "—"],
              ["IP address", selected.ipAddress || "—"],
              ["When", formatDateTime(selected.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 px-3 py-2"><dt className="text-[11px] text-slate-500">{k}</dt><dd className="font-semibold text-slate-900 break-all">{v}</dd></div>
            ))}
          </dl>
          {(selected.changes && Object.keys(selected.changes).length > 0) || selected.details ? (
            <pre className="mt-3 text-[11px] bg-slate-900 text-slate-100 rounded-xl p-3 overflow-auto max-h-64">{JSON.stringify({ changes: selected.changes, details: selected.details }, null, 2)}</pre>
          ) : null}
        </Modal>
      )}
    </>
  );
}
