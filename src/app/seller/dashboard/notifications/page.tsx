"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, HandCoins, RefreshCw, ShoppingBag, Wallet, XCircle } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { fetchVendorNotifications, markAllVendorNotificationsRead, markVendorNotificationRead } from "@/redux/slices/vendorSlice";
import type { SellerNotification } from "@/lib/seller/types";
import { formatDateTime, timeAgo } from "@/lib/seller/format";
import { notificationHref } from "@/components/vendor/VendorHeader";
import { Card, EmptyState, PageHeader, Tabs, btn } from "@/components/vendor/ui";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "UNREAD", label: "Unread" },
  { key: "ORDERS", label: "Orders" },
  { key: "FINANCE", label: "Finance" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const isFinance = (t: string) => t.includes("COD") || t.includes("WITHDRAWAL") || t.includes("PAYMENT");

const iconFor = (n: SellerNotification) => {
  const t = n.type || "";
  if (t.includes("CANCEL")) return { Icon: XCircle, cls: "bg-red-50 text-red-600" };
  if (t.includes("COD")) return { Icon: HandCoins, cls: "bg-violet-50 text-violet-600" };
  if (isFinance(t)) return { Icon: Wallet, cls: "bg-emerald-50 text-emerald-600" };
  if (t.includes("ORDER")) return { Icon: ShoppingBag, cls: "bg-blue-50 text-blue-600" };
  return { Icon: Bell, cls: "bg-vendor-soft text-vendor" };
};

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications, unreadNotificationsCount } = useVendor();
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const visible = useMemo(
    () =>
      notifications.filter((n) => {
        const t = n.type || "";
        if (filter === "UNREAD") return !n.isRead;
        if (filter === "ORDERS") return t.includes("ORDER");
        if (filter === "FINANCE") return isFinance(t);
        return true;
      }),
    [notifications, filter]
  );

  const open = (n: SellerNotification) => {
    if (!n.isRead) dispatch(markVendorNotificationRead(n._id));
    router.push(notificationHref(n));
  };

  const refresh = async () => {
    setRefreshing(true);
    await dispatch(fetchVendorNotifications());
    setRefreshing(false);
  };

  return (
    <>
      <PageHeader
        title="Inbox & Activity"
        subtitle={unreadNotificationsCount ? `${unreadNotificationsCount} unread` : "You're all caught up"}
        actions={
          <>
            <button type="button" onClick={refresh} className={btn.outline} aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => dispatch(markAllVendorNotificationsRead())} disabled={!unreadNotificationsCount} className={btn.primary}>
              <CheckCheck className="w-4 h-4" /> Mark all as read
            </button>
          </>
        }
      />
      <div className="space-y-4">
        <Tabs
          tabs={FILTERS}
          active={filter}
          onChange={setFilter}
          counts={{
            ALL: notifications.length,
            UNREAD: notifications.filter((n) => !n.isRead).length,
            ORDERS: notifications.filter((n) => (n.type || "").includes("ORDER")).length,
            FINANCE: notifications.filter((n) => isFinance(n.type || "")).length,
          }}
        />
        <Card>
          {visible.length === 0 ? (
            <EmptyState icon={Bell} title="No Notifications" text="Order, payment and COD updates for your store will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((n) => {
                const { Icon, cls } = iconFor(n);
                return (
                  <li key={n._id}>
                    <button type="button" onClick={() => open(n)} className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-slate-50 cursor-pointer ${!n.isRead ? "bg-vendor-soft/40" : ""}`}>
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-3">
                          <span className={`text-sm truncate ${n.isRead ? "font-semibold text-slate-700" : "font-extrabold text-slate-900"}`}>{n.title}</span>
                          <span className="text-[11px] text-slate-400 shrink-0" title={formatDateTime(n.createdAt)}>
                            {timeAgo(n.createdAt)}
                          </span>
                        </span>
                        <span className="block text-xs text-slate-600 mt-0.5">{n.message}</span>
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-vendor mt-2 shrink-0" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
