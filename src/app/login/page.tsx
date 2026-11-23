"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector, useHydrated } from "@/redux/hooks";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { loginUser, clearAuthError } from "@/redux/slices/authSlice";
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, successMessage } = useAppSelector(
    (state) => state.auth
  );
  // Auth state comes from localStorage, so only apply it after hydration (avoids SSR mismatch).
  const hydrated = useHydrated();
  const busy = hydrated && (loading || isAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }

    const result = await dispatch(loginUser({ email: email.trim(), password }));
    if (loginUser.fulfilled.match(result)) {
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-6 sm:py-10 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-[420px] mx-auto flex flex-col items-center">
        
        {/* ── BhansaMart Cart Logo ── */}
        <Link href="/" className="mb-6 focus:outline-none" title="BhansaMart Home">
          <img
            src="/images/bhansamart-cart-logo.png"
            alt="BhansaMart"
            className="h-20 w-auto object-contain"
          />
        </Link>

        {/* ── Welcome Back Title ── */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight text-center mb-6">
          Welcome Back
        </h1>

        {/* ── Alerts ── */}
        {formError || error ? (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{formError || error}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}! Redirecting...</span>
          </div>
        ) : null}

        {/* ── Login Form ── */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          
          {/* Email Address */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B4D58] focus:ring-1 focus:ring-[#0B4D58] transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B4D58] focus:ring-1 focus:ring-[#0B4D58] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forget password row */}
          <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-[#0B4D58] focus:ring-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-[#0B4D58] hover:underline font-semibold focus:outline-none cursor-pointer"
            >
              Forget password ?
            </Link>
          </div>

          {/* Terms & Privacy */}
          <p className="text-[11px] sm:text-xs text-slate-500 text-center pt-2 leading-relaxed">
            By continuing you agree to our{" "}
            <Link href="/terms-and-conditions" className="text-[#0B4D58] hover:underline font-semibold">
              Terms of Services
            </Link>{" "}
            &{" "}
            <Link href="/privacy-policy" className="text-[#0B4D58] hover:underline font-semibold">
              Privacy Policy
            </Link>
          </p>

          {/* Login Button (Dark Teal) */}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-[#0B4D58] hover:bg-[#083C45] active:scale-[0.99] text-white font-bold text-xs sm:text-sm md:text-base rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus:outline-none mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{loading ? "Logging in..." : "Login"}</span>
          </button>
        </form>

        {/* ── OR Divider ── */}
        <div className="w-full flex items-center my-5">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3 text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* ── Sign in with Google Button ── */}
        <GoogleSignInButton text="signin_with" disabled={busy} />

        {/* ── Switch to Register ── */}
        <p className="text-xs sm:text-sm text-slate-600 mt-6 text-center">
          Don&apos;t have Account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#0B4D58] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
