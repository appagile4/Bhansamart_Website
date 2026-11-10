"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchMyVendorProfile,
  fetchVendorNotifications,
  fetchVendorStats,
} from "@/redux/slices/vendorSlice";
import VendorSidebar from "./VendorSidebar";
import VendorHeader from "./VendorHeader";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const vendorToken = vendorState?.vendorToken;

  const [collapsed, setCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check localStorage token if state is empty
    const localToken =
      typeof window !== "undefined"
        ? localStorage.getItem("bhansa_vendor_token") ||
          localStorage.getItem("vendor_token")
        : null;

    if (!vendorToken && !localToken) {
      router.replace("/seller");
      return;
    }

    setCheckingAuth(false);

    // Initial background sync
    dispatch(fetchMyVendorProfile());
    dispatch(fetchVendorStats());
    dispatch(fetchVendorNotifications());
  }, [vendorToken, dispatch, router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0C831F] flex items-center justify-center text-white font-bold text-2xl shadow-lg animate-pulse mb-4">
          B
        </div>
        <p className="text-sm font-semibold text-gray-600">
          Loading BhansaMart Seller Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      {/* ── Left Sidebar ── */}
      <VendorSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* ── Main Dashboard Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <VendorHeader
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
