"use client";

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search, ShoppingCart, ChevronDown, User, LogOut, BookOpen, Package, MapPin, X, Mic } from "lucide-react";
import { useAppDispatch, useAppSelector, useCurrentAddress } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import { openCart } from "@/redux/slices/cartSlice";
import { setSearchQuery } from "@/redux/slices/productsSlice";
import { useRouter } from "next/navigation";
import VoiceSearchModal from "./VoiceSearchModal";

const emptySubscribe = () => () => {};

// Every page renders its own Header, so typing a search on another page mounts a fresh one on "/".
// This flag tells that new Header to put the cursor back in the search box.
let refocusSearchAfterNav = false;

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
  const currentAddress = useCurrentAddress();

  const router = useRouter();
  // The search text lives in Redux (not local state) so it survives the jump to "/"
  const searchInput = useAppSelector((state) => state.products.searchQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const handleSearchChange = (val: string) => {
    dispatch(setSearchQuery(val));
    if (typeof window !== "undefined" && window.location.pathname !== "/" && val.trim().length > 0) {
      refocusSearchAfterNav = true;
      router.push("/");
    }
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(""));
    searchRef.current?.focus();
  };

  // [CHM-06] Voice search: a popup listens, shows the words live, and searches when the user confirms
  const [voiceOpen, setVoiceOpen] = useState(false);
  const closeVoice = useCallback(() => setVoiceOpen(false), []);

  const runVoiceSearch = (text: string) => {
    setVoiceOpen(false);
    dispatch(setSearchQuery(text));
    if (window.location.pathname !== "/") {
      router.push("/"); // the home page scrolls to the results when a search is active
    } else {
      document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Keep typing in the new page's search box after navigating to "/"
  useEffect(() => {
    if (!refocusSearchAfterNav || window.location.pathname !== "/") return;
    refocusSearchAfterNav = false;
    const el = searchRef.current;
    if (!el) return;
    el.focus();
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, []);

  // Animated cycling search placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setUserDropdownOpen(false);
  };

  const shortAddress = currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
    ? currentAddress.addressLine.split(",")[0]
    : "Dwarka Sector 5";

  const fullAddress = currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
    ? currentAddress.addressLine
    : "Plato 19, Dwarka Sector 5, New Delhi";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="w-[94%] sm:w-[92%] lg:w-[90%] xl:w-[88%] 2xl:w-[80%] max-w-7xl mx-auto py-2 sm:py-2.5 lg:py-0 lg:h-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-2.5 lg:gap-4 xl:gap-8">
        
        {/* ── TOP ROW on Mobile (< sm) & Tablet (sm to lg) / LEFT GROUP on Desktop (>= lg) ── */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 shrink-0 w-full lg:w-auto">
          
          {/* Logo & Delivery Location Container */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 min-w-0 flex-1 lg:flex-initial">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center select-none group focus:outline-none shrink-0"
              title="BhansaMart - Home"
            >
              <img
                src="/images/bhansamart-logo.png"
                alt="BhansaMart"
                className="h-7 xs:h-8 sm:h-9 lg:h-10 xl:h-11 w-auto max-w-[92px] min-[360px]:max-w-[110px] xs:max-w-[130px] sm:max-w-[160px] lg:max-w-none object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Mobile / Small Phone Location Chip (< sm) */}
            <button
              type="button"
              onClick={() => dispatch(openAddressModal())}
              className="flex sm:hidden items-center gap-1.5 text-left bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 px-2.5 py-1 rounded-xl cursor-pointer min-w-0 max-w-[140px] xs:max-w-[170px] transition shadow-2xs"
              title="Change Delivery Location"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0C831F]"></span>
              </span>
              <div className="min-w-0 flex-1 truncate">
                <span className="block text-[9px] font-black text-slate-900 uppercase tracking-tight leading-none truncate">
                  15-25 Mins
                </span>
                <span className="block text-[10px] text-slate-500 font-medium truncate leading-tight mt-0.5">
                  {shortAddress}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Tablet & Desktop Location Selector (>= sm) */}
            <div
              onClick={() => dispatch(openAddressModal())}
              className="hidden sm:flex flex-col text-left cursor-pointer select-none group border-l border-slate-200/80 pl-3 sm:pl-4 lg:pl-5 min-w-[160px] sm:min-w-[180px] lg:min-w-[190px] xl:min-w-[220px] max-w-[240px] xl:max-w-[270px] hover:bg-slate-50/80 -my-1.5 py-1.5 pr-2 rounded-xl transition"
              title="Change Delivery Location"
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C831F]"></span>
                </span>
                <span className="font-extrabold text-xs sm:text-[13px] lg:text-sm text-slate-900 leading-tight">
                  Delivery in 15-25 mins
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 font-normal leading-tight mt-0.5 group-hover:text-emerald-700 transition">
                <span className="truncate max-w-[150px] sm:max-w-[180px] xl:max-w-[210px]">
                  {fullAddress}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-700 shrink-0 stroke-[2.5] transition-transform group-hover:translate-y-0.5" />
              </div>
            </div>
          </div>

          {/* Right Action Icons on Mobile & Tablet (< lg) */}
          <div className="flex lg:hidden items-center gap-1.5 xs:gap-2 sm:gap-3 shrink-0 relative" ref={dropdownRef}>
            {/* User Account / Login */}
            {mounted && isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center p-1 rounded-full hover:bg-slate-100 transition focus:outline-none cursor-pointer"
                  title={user.name}
                  aria-label="User Account Menu"
                >
                  <div className="w-7 h-7 xs:w-8 xs:h-8 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 flex items-center justify-center font-extrabold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-[60] animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      {user.rewardPoints !== undefined && (
                        <p className="text-[10px] font-semibold text-emerald-700 mt-1">
                          🎁 {user.rewardPoints} Reward Points
                        </p>
                      )}
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
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0C831F] px-1.5 sm:px-2.5 py-1.5 transition focus:outline-none cursor-pointer whitespace-nowrap"
              >
                Login
              </Link>
            )}

            {/* Mobile / Tablet Cart Button */}
            <button
              type="button"
              onClick={onCartClick || (() => dispatch(openCart()))}
              className={`flex items-center gap-1 xs:gap-1.5 px-2.5 xs:px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs focus:outline-none cursor-pointer active:scale-95 shrink-0 ${
                mounted && totalCount > 0
                  ? "bg-[#0C831F] text-white hover:bg-[#0a6f1a]"
                  : "bg-[#D6D9DD] hover:bg-[#C2C6CC] text-white"
              }`}
              title="View Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" strokeWidth={2.4} />
              <span className="whitespace-nowrap">
                {mounted && totalCount > 0 ? (
                  <>
                    <span className="sm:hidden max-[359px]:hidden">{totalCount} • ₹{totalPrice}</span>
                    <span className="hidden max-[359px]:inline">{totalCount}</span>
                    <span className="hidden sm:inline">{totalCount} items • ₹{totalPrice}</span>
                  </>
                ) : (
                  <>
                    <span className="xs:hidden max-[359px]:sr-only">Cart</span>
                    <span className="hidden xs:inline">My Cart</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* ── SEARCH BAR (Full Width on Mobile & Tablet < lg, Centered Flex on Desktop >= lg) ── */}
        <div className="w-full lg:flex-1 lg:max-w-xl xl:max-w-2xl lg:mx-2 xl:mx-4">
          <div className="relative flex items-center w-full bg-[#F4F6F8] hover:bg-[#ECEFF2] focus-within:bg-white rounded-xl border border-slate-200/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-50 transition-all">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 sm:left-3.5 pointer-events-none shrink-0" />
            <input
              ref={searchRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              aria-label="Search products"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                // Enter / the keyboard's search key: close the mobile keyboard and show the results
                e.currentTarget.blur();
                document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              className="w-full bg-transparent pl-9 sm:pl-10 pr-16 py-2 sm:py-2.5 lg:py-3 text-[15px] sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal outline-none"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchInput.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setVoiceOpen(true)}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  voiceOpen
                    ? "bg-rose-500 text-white"
                    : "text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60"
                }`}
                title="Search by voice"
                aria-label="Search by voice"
                aria-haspopup="dialog"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <VoiceSearchModal open={voiceOpen} onClose={closeVoice} onSearch={runVoiceSearch} />

        {/* ── DESKTOP RIGHT ACTIONS (>= lg) ── */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-5 shrink-0 relative" ref={dropdownRef}>
          {/* Desktop User Account */}
          {mounted && isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-700 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition focus:outline-none cursor-pointer"
                title={user.name}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60 flex items-center justify-center font-extrabold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="inline-block max-w-[90px] xl:max-w-[120px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-[60] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    {user.rewardPoints !== undefined && (
                      <p className="text-[10px] font-semibold text-emerald-700 mt-1">
                        🎁 {user.rewardPoints} Reward Points
                      </p>
                    )}
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
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0C831F] px-2.5 py-2 transition focus:outline-none cursor-pointer whitespace-nowrap"
            >
              Login
            </Link>
          )}

          {/* Desktop My Cart Button */}
          <button
            type="button"
            onClick={onCartClick || (() => dispatch(openCart()))}
            className={`flex items-center gap-2 xl:gap-2.5 px-4 xl:px-5 py-2.5 xl:py-3 rounded-xl font-bold text-xs xl:text-sm transition-all shadow-xs focus:outline-none cursor-pointer active:scale-95 shrink-0 ${
              mounted && totalCount > 0
                ? "bg-[#0C831F] text-white hover:bg-[#0a6f1a]"
                : "bg-[#D6D9DD] hover:bg-[#C2C6CC] text-white"
            }`}
            title="View Cart"
          >
            <ShoppingCart className="w-4 h-4 xl:w-5 xl:h-5 text-white shrink-0" strokeWidth={2.4} />
            <span className="whitespace-nowrap">
              {mounted && totalCount > 0 ? `${totalCount} items • ₹${totalPrice}` : "My Cart"}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
}
