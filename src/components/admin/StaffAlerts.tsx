"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Bell, BellRing, Bike, RotateCcw, ShoppingBag, Tag, Ticket } from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { timeAgo } from "@/lib/seller/format";
import { useConsole } from "@/lib/admin/console";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Tabs, btn } from "./ui";

const ALERT_FILTERS = [
  { key: "all", label: "All Alerts" },
  { key: "staff_order", label: "Orders" },
  { key: "staff_withdrawal", label: "Withdrawals" },
  { key: "staff_brand", label: "Brands" },
  { key: "staff_refund", label: "Returns / Refunds" },
  { key: "staff_cod", label: "Delivery & COD" },
  { key: "staff_alert", label: "General Alerts" },
] as const;
type AlertFilter = (typeof ALERT_FILTERS)[number]["key"];

// Alert type → icon and the screen it opens (path relative to the console base)
const ALERT_META: Record<string, { icon: React.ElementType; cls: string; path?: string; staffPath?: string }> = {
  staff_order: { icon: ShoppingBag, cls: "bg-emerald-50 text-emerald-600", path: "/orders" },
  staff_withdrawal: { icon: Banknote, cls: "bg-amber-50 text-amber-600", path: "/withdrawals" },
  staff_brand: { icon: Tag, cls: "bg-sky-50 text-[#0284C7]", path: "/brands" },
  staff_refund: { icon: RotateCcw, cls: "bg-violet-50 text-violet-600", path: "/refunds" },
  staff_cod: { icon: Bike, cls: "bg-indigo-50 text-indigo-600", path: "/delivery", staffPath: "/cod" },
  staff_delivery: { icon: Bike, cls: "bg-indigo-50 text-indigo-600", path: "/delivery" },
  staff_ticket: { icon: Ticket, cls: "bg-rose-50 text-rose-600", path: "/tickets" },
};
const alertMeta = (type: string) => ALERT_META[type] || { icon: Bell, cls: "bg-slate-100 text-slate-600" };

/** Operational alerts — app: adminScreens/notifications "alerts" tab and staffadminScreens/NotificationsScreen */
export default function StaffAlerts() {
  const router = useRouter();
  const { staff, base } = useConsole();
  const [filter, setFilter] = useState<AlertFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const q = useAsync(() => api.getStaffAlerts({ type: filter, unreadOnly, page }), `${filter}|${unreadOnly}|${page}`);

  const open = (n: api.StaffAlert) => {
    if (!n.isRead) {
      q.setData((d) => (d ? { ...d, unreadCount: Math.max(0, d.unreadCount - 1), notifications: d.notifications.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)) } : d));
      api.markStaffAlertRead(n._id).catch(() => undefined);
    }
    const m = alertMeta(n.type);
    const path = n.data?.kind === "STORAGE_RECHARGE" ? "/storage?tab=recharges" : (staff && m.staffPath) || m.path;
    if (path) router.push(`${base}${path}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <Tabs tabs={ALERT_FILTERS} active={filter} onChange={(k) => { setFilter(k); setPage(1); }} />
        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer shrink-0">
          <input type="checkbox" className="w-4 h-4 accent-[#0284C7]" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1); }} />
          Unread only{q.data ? ` (${q.data.unreadCount})` : ""}
        </label>
      </div>
      {q.error && <ErrorBanner message={q.error} onRetry={q.reload} />}
      <Card>
        {q.loading && !q.data ? (
          <LoadingBlock text="Loading alerts…" />
        ) : !q.data?.notifications.length ? (
          <EmptyState icon={BellRing} title="No operational alerts" text="New orders, withdrawals, brand submissions and returns show up here." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {q.data.notifications.map((n) => {
              const m = alertMeta(n.type);
              return (
                <li key={n._id}>
                  <button type="button" onClick={() => open(n)} className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 cursor-pointer ${n.isRead ? "" : "bg-sky-50/40"}`}>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.cls}`}><m.icon className="w-4 h-4" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className={`text-sm truncate ${n.isRead ? "font-semibold text-slate-700" : "font-extrabold text-slate-900"}`}>{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#0284C7] shrink-0" aria-label="Unread" />}
                      </span>
                      <span className="block text-xs text-slate-600 line-clamp-2">{n.message}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Pager page={page} pages={q.data?.totalPages || 1} onPage={setPage} />
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={btn.outline}>Previous</button>
      <span className="text-sm text-slate-600">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={btn.outline}>Next</button>
    </div>
  );
}
