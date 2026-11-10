"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, User, LogOut, BookOpen, Package } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import { openCart } from "@/redux/slices/cartSlice";

const emptySubscribe = () => () => {};

const SEARCH_PLACEHOLDERS = [
  'Search "egg"',
  'Search "milk"',
  'Search "bread"',
  'Search "chips"',
  'Search "atta"',
  'Search "curd"',
];

export interface HeaderProps {
  onCartClick?: () => void;
}

export default function Header({ onCartClick }: HeaderProps) {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { totalCount, totalPrice } = useAppSelector((state) => state.cart);
  const { currentAddress } = useAppSelector((state) => state.address);

  const [searchInput, setSearchInput] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Subtle animated cycling search placeholder matching quick commerce experience
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="w-[90%] mx-auto h-20 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* ── 1. Brand Logo (BhansaMart) ── */}
        <div className="flex items-center gap-6 shrink-0">
          <Link
            href="/"
            className="flex items-center select-none group focus:outline-none shrink-0"
            title="BhansaMart"
          >
            <img
              src="/images/bhansamart-logo.png"
              alt="BhansaMart"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* ── 2. Location & Delivery Time Selector ── */}
          <div
            onClick={() => dispatch(openAddressModal())}
            className="hidden md:flex flex-col text-left cursor-pointer select-none group border-l border-slate-200/80 pl-6 min-w-[210px] max-w-[260px]"
            title="Change Delivery Location"
          >
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[13px] sm:text-sm text-slate-900 leading-tight">
                Delivery in 15-25 minutes
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-normal leading-tight mt-0.5 group-hover:text-slate-800 transition">
              <span className="truncate max-w-[195px]">
                {currentAddress.addressLine}
              </span>
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
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              className="w-full bg-transparent pl-11 pr-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal outline-none"
            />
          </div>
        </div>

        {/* ── 4. Right Actions: User Account & Cart ── */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0 relative">
          
          {/* User Account State */}
          {mounted && isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition focus:outline-none cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="hidden lg:inline-block max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen ? (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    {user.rewardPoints !== undefined ? (
                      <p className="text-[10px] font-semibold text-emerald-700 mt-1">
                        🎁 {user.rewardPoints} Reward Points
                      </p>
                    ) : null}
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/profile?tab=address"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Address Book</span>
                  </Link>

                  <Link
                    href="/profile?tab=orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition border-b border-slate-100 pb-2.5"
                  >
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Your Orders</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#0C831F] px-2 sm:px-3 py-2 transition focus:outline-none cursor-pointer"
            >
              Login
            </Link>
          )}

          {/* My Cart Button */}
          <button
            type="button"
            onClick={onCartClick || (() => dispatch(openCart()))}
            className={`flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs focus:outline-none cursor-pointer active:scale-95 ${
              mounted && totalCount > 0
                ? "bg-[#0C831F] text-white hover:bg-[#0a6f1a]"
                : "bg-[#D6D9DD] hover:bg-[#C2C6CC] text-white"
            }`}
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.4} />
            <span className="whitespace-nowrap">
              {mounted && totalCount > 0 ? `${totalCount} items • ₹${totalPrice}` : "My Cart"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
