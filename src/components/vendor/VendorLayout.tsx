"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import {
  fetchCodSummary,
  fetchMyVendorProfile,
  fetchVendorNotifications,
  fetchVendorOrders,
  fetchVendorStats,
} from "@/redux/slices/vendorSlice";
import VendorSidebar from "./VendorSidebar";
import VendorHeader from "./VendorHeader";
import VendorRealtime from "./VendorRealtime";
import { StorageAlertBanner } from "./StorageWidgets";
import { canAccessSellerDashboard } from "@/lib/sellerStatus";

const noopSubscribe = () => () => {};
const readToken = () => {
  try {
    return Boolean(localStorage.getItem("bhansa_vendor_token") || localStorage.getItem("vendor_token"));
  } catch {
    return false;
  }
};

/** Seller Hub shell — mounted once by app/seller/dashboard/layout.tsx */
export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useVendor();
  const vendorToken = vendorState.vendorToken;

  // null on the server AND during hydration, then whether this browser holds a vendor session.
  // Gating on it (not just the Redux token, which the root initializer may fill before this
  // segment hydrates) keeps the first client render identical to the prerendered loading screen.
  const hasStoredToken = useSyncExternalStore(noopSubscribe, readToken, () => null);
  const authed = hasStoredToken !== null && (Boolean(vendorToken) || hasStoredToken);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hasStoredToken === null) return;
    if (!authed) {
      router.replace("/seller");
      return;
    }
    dispatch(fetchMyVendorProfile());
    dispatch(fetchVendorStats());
    dispatch(fetchVendorOrders());
    dispatch(fetchVendorNotifications());
    dispatch(fetchCodSummary());
  }, [authed, hasStoredToken, dispatch, router]);

  // Mobile drawer: lock page scroll behind it, close on Escape, and close if the screen grows to desktop
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [mobileOpen]);

  // Pending / draft / rejected vendors may not use the dashboard — same rule as the app
  const { vendorProfile, vendorUser } = vendorState;
  const hasProfile = Boolean(vendorProfile || vendorUser);
  const dashboardAllowed = canAccessSellerDashboard(vendorProfile, vendorUser);

  useEffect(() => {
    if (authed && hasProfile && !dashboardAllowed) router.replace("/seller/onboarding");
  }, [authed, hasProfile, dashboardAllowed, router]);

  // The page segment is ALWAYS rendered (Next.js validates/prerenders it — an "unrendered segment"
  // would skip instant-navigation checks). Until the session is confirmed, an opaque loading
  // screen covers it; signed-out visitors are redirected to /seller by the effect above.
  const blocked = !authed || (hasProfile && !dashboardAllowed);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      {blocked && (
        <div className="fixed inset-0 z-[90] bg-[#F8FAFC] flex flex-col items-center justify-center" role="status" aria-live="polite">
          <Image src="/images/seller/vendor-cart-badge.png" alt="BhansaMart" width={120} height={120} className="animate-pulse mb-2" priority />
          <p className="text-sm font-semibold text-slate-600">Loading BhansaMart Seller Hub...</p>
        </div>
      )}
      <VendorSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <VendorHeader
          onToggleSidebar={() => {
            if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
              setCollapsed((c) => !c);
            } else {
              setMobileOpen(true);
            }
          }}
        />

        <main className="flex-1 w-full min-w-0 px-3 py-4 sm:p-4 md:p-6 lg:p-8">
          {/* Caps line length on very wide screens so cards and tables don't stretch edge to edge */}
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            {authed && (
              <React.Suspense fallback={null}>
                <StorageAlertBanner />
              </React.Suspense>
            )}
            {children}
          </div>
        </main>
      </div>

      {authed && <VendorRealtime />}
    </div>
  );
}
