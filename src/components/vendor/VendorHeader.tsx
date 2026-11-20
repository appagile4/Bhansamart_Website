"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { logoutVendor, markVendorNotificationRead } from "@/redux/slices/vendorSlice";
import { disconnectVendorSocket } from "@/lib/seller/socket";
import { initials, timeAgo } from "@/lib/seller/format";
import type { SellerNotification } from "@/lib/seller/types";

/** Where a notification should take the seller — app: notifications.tsx handleNotificationPress */
export const notificationHref = (n: SellerNotification) => {
  const type = n.type || "";
  // `order` arrives populated (object) from the notifications list, as an id elsewhere
  const orderId = typeof n.order === "string" ? n.order : n.order?._id;
  if (orderId) return `/seller/dashboard/orders/${encodeURIComponent(orderId)}`;
  if (String(n.data?.kind || "").startsWith("STORAGE")) return "/seller/dashboard/storage";
  if (type.includes("COD")) return "/seller/dashboard/cod-handover";
  if (type.includes("WITHDRAWAL") || type.includes("PAYMENT")) return "/seller/dashboard/transactions";
  if (type.includes("ORDER")) return "/seller/dashboard/orders";
  return "/seller/dashboard/notifications";
};

/** App: components/VendorComponent/header.tsx — menu, store title, notifications, profile */
export default function VendorHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const v = useVendor();
  const { vendorUser, vendorProfile, notifications, unreadNotificationsCount, isStoreOpen } = v;

  const [menu, setMenu] = useState<"profile" | "notif" | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    disconnectVendorSocket();
    dispatch(logoutVendor());
    router.replace("/seller");
  };

  const storeName = vendorProfile?.businessDetails?.businessName || v.stats?.storeName || `${vendorUser?.name || "Vendor"}'s Store`;

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between gap-3 px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Title & store subtitle / status */}
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-vendor-dark truncate">{storeName}</p>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? "bg-vendor-done" : "bg-red-500"}`} />
            {isStoreOpen ? "Vendor Store · Open" : "Vendor Store · Closed"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2" ref={wrapRef}>
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === "notif" ? null : "notif")}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label={`Notifications${unreadNotificationsCount ? `, ${unreadNotificationsCount} unread` : ""}`}
            aria-expanded={menu === "notif"}
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {menu === "notif" && (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                <Link href="/seller/dashboard/notifications" onClick={() => setMenu(null)} className="text-xs text-vendor-teal hover:underline font-semibold">
                  View all
                </Link>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400">No notifications yet</p>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => {
                        if (!n.isRead) dispatch(markVendorNotificationRead(n._id));
                        setMenu(null);
                        router.push(notificationHref(n));
                      }}
                      className={`w-full text-left p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? "bg-vendor-soft/50" : ""}`}
                    >
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-vendor shrink-0" />}
                        {n.title}
                      </p>
                      <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(menu === "profile" ? null : "profile")}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-vendor-dark to-vendor flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer"
            aria-expanded={menu === "profile"}
            aria-label="Account menu"
          >
            {vendorProfile?.brandDetails?.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendorProfile.brandDetails.brandLogo} alt="" className="w-full h-full object-cover bg-white" />
            ) : (
              initials(vendorUser?.name || storeName)
            )}
          </button>

          {menu === "profile" && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{vendorUser?.name || "Vendor"}</p>
                <p className="text-[11px] text-slate-500 truncate">{vendorUser?.email}</p>
              </div>
              <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
