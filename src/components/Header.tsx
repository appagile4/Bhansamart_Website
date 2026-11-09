"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, MapPin } from "lucide-react";

export interface HeaderProps {
  deliveryTime?: string;
  address?: string;
  onAddressClick?: () => void;
  onLoginClick?: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
}

export default function Header({
  deliveryTime = "18 minutes",
  address = "O-91, O Pocket, Pocket O, Phas...",
  onAddressClick,
  onLoginClick,
  onCartClick,
  cartItemCount = 0,
}: HeaderProps) {
  const [searchInput, setSearchInput] = useState("");
  const searchPlaceholders = ['Search "egg"', 'Search "milk"', 'Search "bread"', 'Search "chips"', 'Search "curd"'];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Subtle animated cycling search placeholder matching quick commerce experience
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="w-[90%] mx-auto h-20 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* ── 1. Brand Logo (BhansaMart) ── */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center select-none group focus:outline-none shrink-0" title="BhansaMart">
            <img
              src="/images/bhansamart-logo.png"
              alt="BhansaMart"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* ── 2. Location & Delivery Time Selector ── */}
          <div
            onClick={onAddressClick}
            className="hidden md:flex flex-col text-left cursor-pointer select-none group border-l border-slate-200/80 pl-6 min-w-[210px] max-w-[260px]"
            title="Change Delivery Location"
          >
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[13px] sm:text-sm text-slate-900 leading-tight">
                Delivery in {deliveryTime}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-normal leading-tight mt-0.5 group-hover:text-slate-800 transition">
              <span className="truncate max-w-[195px]">{address}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-700 shrink-0 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* ── 3. Search Bar ── */}
        <div className="flex-1 max-w-3xl mx-2 sm:mx-4">
          <div className="relative flex items-center w-full bg-[#F4F6F8] hover:bg-[#ECEFF2] focus-within:bg-white rounded-xl border border-slate-200/70 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholders[placeholderIndex]}
              className="w-full bg-transparent pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal outline-none"
            />
          </div>
        </div>

        {/* ── 4. Right Actions: Login & My Cart ── */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          {/* Login Link */}
          <button
            type="button"
            onClick={onLoginClick}
            className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-black px-2 sm:px-3 py-2 transition focus:outline-none cursor-pointer"
          >
            Login
          </button>

          {/* My Cart Button */}
          <button
            type="button"
            onClick={onCartClick}
            className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs focus:outline-none cursor-pointer active:scale-95 ${
              cartItemCount > 0
                ? "bg-[#0C831F] text-white hover:bg-[#0a6f1a]"
                : "bg-[#D6D9DD] hover:bg-[#C2C6CC] text-white"
            }`}
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.4} />
            <span className="whitespace-nowrap">
              {cartItemCount > 0 ? `${cartItemCount} items` : "My Cart"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
