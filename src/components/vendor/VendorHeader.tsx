"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ExternalLink,
  Store,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  logoutVendor,
  markVendorNotificationRead,
  updateStoreStatus,
} from "@/redux/slices/vendorSlice";

export default function VendorHeader({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    vendorUser,
    vendorProfile,
    notifications,
    unreadNotificationsCount,
    isStoreOpen,
    deliveryRadiusKm,
  } = useAppSelector((state) => state.vendor);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logoutVendor());
    router.replace("/seller");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/seller/dashboard/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const storeName =
    vendorProfile?.businessDetails?.businessName ||
    vendorProfile?.storeName ||
    `${vendorUser?.name || "Vendor"}'s Store`;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* ── Left: Collapse button & Search Bar ── */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
          />
        </form>
      </div>

      {/* ── Right: Store Status, Radius, Notifications & Profile ── */}
      <div className="flex items-center gap-3">
        {/* Delivery Radius Badge */}
        <Link
          href="/seller/dashboard/delivery"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          title="Delivery Radius Settings"
        >
          <Truck className="w-3.5 h-3.5 text-[#0C831F]" />
          <span>{deliveryRadiusKm || 10} km Radius</span>
        </Link>

        {/* Live Store Status Switch */}
        <button
          onClick={() => dispatch(updateStoreStatus(!isStoreOpen))}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            isStoreOpen
              ? "bg-green-50 text-[#0C831F] border-green-200 hover:bg-green-100"
              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
          }`}
          title={isStoreOpen ? "Store is Open (accepting orders)" : "Store is Closed (offline)"}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStoreOpen ? "bg-[#0C831F] animate-pulse" : "bg-red-500"
            }`}
          />
          <span>{isStoreOpen ? "Store Open" : "Store Closed"}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <span className="font-bold text-sm text-gray-900">Notifications</span>
                <Link
                  href="/seller/dashboard/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-[#0C831F] hover:underline font-semibold"
                >
                  View all
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => dispatch(markVendorNotificationRead(n._id))}
                      className={`p-3 text-xs hover:bg-gray-50 cursor-pointer transition-colors ${
                        !n.isRead ? "bg-green-50/40" : ""
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{n.title}</p>
                      <p className="text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0C831F] to-emerald-400 flex items-center justify-center text-white font-bold text-sm shadow-xs overflow-hidden">
              {vendorUser?.avatar ? (
                <img
                  src={vendorUser.avatar}
                  alt={vendorUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                (vendorUser?.name?.[0] || "V").toUpperCase()
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {vendorUser?.name || "Vendor Partner"}
              </span>
              <span className="text-[10px] font-medium text-gray-500 truncate max-w-[120px]">
                {storeName}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {vendorUser?.name || "Vendor"}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{vendorUser?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#0C831F] border border-green-200 uppercase">
                  {vendorUser?.role || "Vendor"}
                </span>
              </div>

              <div className="py-1">
                <Link
                  href="/seller/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Store className="w-4 h-4 text-gray-400" />
                  Store Settings
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    Customer Storefront
                  </div>
                  <span className="text-[10px] text-gray-400">View</span>
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Logout from Hub
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
