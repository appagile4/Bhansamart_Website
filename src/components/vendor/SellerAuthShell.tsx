"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Boxes,
  ShieldCheck,
  Store,
  TrendingUp,
  Truck,
  User,
} from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Real-time Order Dispatch",
    text: "Live orders with instant delivery partner assignment",
  },
  {
    icon: TrendingUp,
    title: "Transparent Settlements",
    text: "Automated COD collection, wallet balance & fast payouts",
  },
  {
    icon: Boxes,
    title: "Smart Inventory Alerts",
    text: "One-click stock toggles and low inventory notifications",
  },
];

/** App's "VENDOR PORTAL" gradient pill (#003844 → #005b6e, storefront icon in #86C4CB) */
export function VendorPortalBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-vendor-dark to-vendor-mid text-white text-[11px] font-extrabold tracking-[0.08em]">
      <Store className="w-3.5 h-3.5 text-vendor-accent" />
      VENDOR PORTAL
    </span>
  );
}

/** App's cart-badge logo with the portal pill tucked under it, as on the vendor login screen */
export function VendorLogoBlock({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[260px] h-[120px] overflow-hidden">
        <Image
          src="/images/seller/vendor-cart-badge.png"
          alt="BhansaMart"
          fill
          sizes="260px"
          className="object-cover scale-[1.25]"
          priority
        />
      </div>
      <div className="-mt-2">
        <VendorPortalBadge />
      </div>
      <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

interface SellerAuthShellProps {
  children: React.ReactNode;
  /** Subtitle under the logo (mobile) — mirrors the app's header subtitle */
  subtitle?: string;
  /** Wider form column for multi-column forms such as registration */
  wide?: boolean;
}

/**
 * Full-screen frame for the seller login & registration pages:
 * teal brand panel fills the left side, the form fills the right (stacked on phones).
 */
export default function SellerAuthShell({
  children,
  subtitle = "Manage your products, orders & store catalog",
  wide = false,
}: SellerAuthShellProps) {
  return (
    <div
      className={`min-h-screen w-full bg-white font-sans text-slate-900 grid grid-cols-1 ${wide ? "lg:grid-cols-[2fr_3fr]" : "lg:grid-cols-2"}`}
    >
      {/* Brand panel — full height on desktop */}
      <aside className="hidden lg:flex sticky top-0 h-screen bg-gradient-to-br from-vendor-dark via-vendor-mid to-vendor p-10 xl:p-14 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-vendor-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />

        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-3 w-fit"
          aria-label="BhansaMart home"
        >
          <span className="relative block w-[150px] h-[46px] overflow-hidden rounded-lg bg-white">
            <Image
              src="/images/seller/vendor-banner-logo.png"
              alt="BhansaMart"
              fill
              sizes="150px"
              className="object-cover"
              priority
            />
          </span>
          <span className="text-[11px] font-extrabold tracking-[0.15em] text-vendor-accent">
            SELLER HUB
          </span>
        </Link>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-56 h-56 xl:w-64 xl:h-64 rounded-full bg-white shadow-2xl shadow-black/20 overflow-hidden relative">
            <Image
              src="/images/seller/vendor-cart-badge.png"
              alt=""
              fill
              sizes="256px"
              className="object-cover scale-[1.15]"
              priority
            />
          </div>
          <h2 className="mt-8 text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight max-w-md">
            Grow your business with BhansaMart
          </h2>
          <p className="mt-3 text-sm text-vendor-100/90 max-w-md">{subtitle}</p>
        </div>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-3 gap-3">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex xl:flex-col items-start gap-3 bg-white/10 p-3.5 rounded-xl border border-white/10"
            >
              <span className="w-9 h-9 rounded-lg bg-vendor-accent/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-vendor-accent" />
              </span>
              <div className="text-xs">
                <p className="font-bold">{title}</p>
                <p className="text-vendor-100/80 mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 pt-5 border-t border-white/15 text-[11px] text-vendor-100/80 flex items-center justify-between">
          <span>BhansaMart Verified Merchant Protection</span>
          <ShieldCheck className="w-4 h-4 text-vendor-accent" />
        </div>
      </aside>

      {/* Form side — fills the rest of the screen */}
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] lg:bg-white">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-100 lg:border-0">
          <Link
            href="/"
            className="lg:hidden relative block w-[132px] h-[40px] overflow-hidden"
            aria-label="BhansaMart home"
          >
            <Image
              src="/images/seller/vendor-banner-logo.png"
              alt="BhansaMart"
              fill
              sizes="132px"
              className="object-cover"
              priority
            />
          </Link>
          <span className="hidden lg:block" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vendor-soft text-vendor-dark text-xs font-bold hover:bg-vendor-100 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            Customer Store
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
          <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"}`}>
            <div className="lg:hidden mb-6">
              <VendorLogoBlock subtitle={subtitle} />
            </div>
            {children}
          </div>
        </main>

        <footer className="py-4 px-4 text-center text-xs text-slate-400 border-t border-slate-100">
          © 2026 BhansaMart Technologies Pvt. Ltd. All vendor rights reserved.
        </footer>
      </div>
    </div>
  );
}
