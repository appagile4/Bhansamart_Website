"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock,
  ShoppingCart,
  AlertCircle,
  Truck,
  Check,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorNotifications,
  markVendorNotificationRead,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorNotificationsPage() {
  const dispatch = useAppDispatch();
  const { notifications, unreadNotificationsCount } = useAppSelector(
    (state) => state.vendor
  );

  useEffect(() => {
    dispatch(fetchVendorNotifications());
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("bhansa_vendor_token");
      await fetch("/api/vendor/notifications/read-all", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      dispatch(fetchVendorNotifications());
    } catch {
      // ignore
    }
  };

  const handleMarkSingleRead = (id: string) => {
    dispatch(markVendorNotificationRead(id));
  };

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Breadcrumb & Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/seller/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-500 font-medium">Alerts</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Notifications</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Store Notifications
              {unreadNotificationsCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  {unreadNotificationsCount} unread
                </span>
              )}
            </h1>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#0C831F]" />
              Mark All as Read
            </button>
          )}
        </div>

        {/* ── Notifications List ── */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-700 text-sm">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                You will be notified here whenever new customer orders arrive or cash handovers are recorded.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleMarkSingleRead(n._id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  !n.isRead
                    ? "bg-white border-green-200 shadow-xs ring-1 ring-green-100"
                    : "bg-white/80 border-gray-100 hover:bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    !n.isRead
                      ? "bg-green-50 text-[#0C831F]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
