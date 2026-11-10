"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  TrendingUp,
  Boxes,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  loginVendorPassword,
  clearVendorAlerts,
} from "@/redux/slices/vendorSlice";

export default function SellerLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const isLoading = vendorState?.isLoading ?? false;
  const error = vendorState?.error ?? null;
  const isAuthenticated = vendorState?.isAuthenticated ?? false;
  const vendorToken = vendorState?.vendorToken ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token =
      vendorToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("bhansa_vendor_token")
        : null);

    if (token) {
      router.replace("/seller/dashboard");
    }
  }, [vendorToken, router]);

  useEffect(() => {
    dispatch(clearVendorAlerts());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Please enter your registered vendor email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your account password.");
      return;
    }

    try {
      const resultAction = await dispatch(
        loginVendorPassword({ email: email.trim(), password })
      );

      if (loginVendorPassword.fulfilled.match(resultAction)) {
        router.replace("/seller/dashboard");
      }
    } catch {
      setLocalError("Failed to authenticate. Please check your credentials.");
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-gray-900">
      {/* ── Top Header Navigation ── */}
      <header className="h-18 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0C831F] to-[#25A53B] flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
            B
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-tight">
              Bhansa<span className="text-[#0C831F]">Mart</span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Seller Hub
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs md:text-sm font-semibold text-gray-600 hover:text-[#0C831F] flex items-center gap-1.5 transition-colors"
        >
          Customer Storefront
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* ── Main Form Section ── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: Branding & Value Props */}
          <div className="bg-gradient-to-br from-[#0C831F] via-[#09711A] to-[#065012] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide text-white border border-white/20 mb-6">
                <Store className="w-3.5 h-3.5" />
                Merchant Portal
              </span>
              <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
                Grow Your Business with BhansaMart
              </h2>
              <p className="mt-3 text-sm text-green-50/90 leading-relaxed">
                Manage orders, track inventory, view live settlements, and deliver fresh groceries to thousands of local customers in 15 minutes.
              </p>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <Truck className="w-5 h-5 text-green-300 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Real-time Order Dispatch</p>
                  <p className="text-green-100/80">Manage live orders with instant delivery boy assignment</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <TrendingUp className="w-5 h-5 text-green-300 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Transparent Settlements</p>
                  <p className="text-green-100/80">Automated COD collection, wallet balance & fast payouts</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <Boxes className="w-5 h-5 text-green-300 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Smart Inventory Alerts</p>
                  <p className="text-green-100/80">One-click stock toggles and low inventory notifications</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/15 text-[11px] text-green-100/80 flex items-center justify-between">
              <span>BhansaMart Verified Merchant Protection</span>
              <ShieldCheck className="w-4 h-4 text-green-300" />
            </div>
          </div>

          {/* Right: Vendor Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                Vendor Sign In
              </h3>
              <p className="text-xs text-gray-500 mt-1.5">
                Access your store inventory, incoming orders and earnings
              </p>
            </div>

            {/* Error Banner */}
            {(localError || error) && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Vendor Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. store@bhansamart.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-sm pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:ring-2 focus:ring-green-100 focus:outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#0C831F] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-sm pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:ring-2 focus:ring-green-100 focus:outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#0C831F] rounded border-gray-300 focus:ring-[#0C831F] accent-[#0C831F]"
                  />
                  Keep me logged in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] active:bg-[#085C15] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Seller Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials for Testing */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Test Vendor Account (Password: Password@123)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo("himalayan@gmail.com", "Password@123")}
                  className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors text-center cursor-pointer"
                >
                  Fill: himalayan@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo("vikash@gmail.com", "Password@123")}
                  className="flex-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors text-center cursor-pointer"
                >
                  Fill: Annapurna Store
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        © 2026 BhansaMart Technologies Pvt. Ltd. All vendor rights reserved.
      </footer>
    </div>
  );
}
