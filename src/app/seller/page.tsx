"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Check,
  Store,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import {
  loginVendorPassword,
  sendVendorOtp,
  verifyVendorOtp,
  clearVendorAlerts,
  VendorSessionResponse,
} from "@/redux/slices/vendorSlice";
import SellerAuthShell, { VendorPortalBadge } from "@/components/vendor/SellerAuthShell";
import OtpInput from "@/components/vendor/OtpInput";
import {
  sellerErrorBox,
  sellerHelper,
  sellerInputIcon,
  sellerInputWithIcon,
  sellerLabel,
  sellerLink,
  sellerOutlineBtn,
  sellerPrimaryBtn,
  sellerSuccessBox,
} from "@/components/vendor/sellerUi";
import { getSellerHomeRoute } from "@/lib/sellerStatus";

type LoginMode = "password" | "otp";
const RESEND_SECONDS = 60; // same as the app

const readStored = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function SellerLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const vendorState = useVendor();
  const isLoading = vendorState?.isLoading ?? false;
  const error = vendorState?.error ?? null;
  const successMessage = vendorState?.successMessage ?? null;
  const vendorToken = vendorState?.vendorToken ?? null;

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // Already signed in → go straight to the right place for this vendor's status
  useEffect(() => {
    const token = vendorToken || localStorage.getItem("bhansa_vendor_token");
    if (token) {
      router.replace(
        getSellerHomeRoute(
          vendorState?.vendorProfile || readStored("bhansa_vendor_profile"),
          vendorState?.vendorUser || readStored("bhansa_vendor_user")
        )
      );
    }
  }, [vendorToken, vendorState?.vendorProfile, vendorState?.vendorUser, router]);

  useEffect(() => {
    dispatch(clearVendorAlerts());
  }, [dispatch]);

  // OTP resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setLocalError(null);
    setOtp("");
    setOtpSent(false);
    dispatch(clearVendorAlerts());
  };

  const goHome = (payload: VendorSessionResponse) => {
    setEmail("");
    setPassword("");
    setOtp("");
    router.replace(getSellerHomeRoute(payload?.vendor, payload?.user));
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) return setLocalError("Please enter your registered vendor email address.");
    if (!password) return setLocalError("Please enter your account password.");

    const result = await dispatch(loginVendorPassword({ email: email.trim(), password }));
    if (loginVendorPassword.fulfilled.match(result)) {
      setEmail("");
      setPassword("");
      goHome(result.payload);
    }
  };

  const handleSendOtp = async () => {
    setLocalError(null);
    if (!email.trim()) return setLocalError("Please enter your registered vendor email address.");
    const result = await dispatch(sendVendorOtp(email.trim()));
    if (sendVendorOtp.fulfilled.match(result)) {
      setOtpSent(true);
      setOtp("");
      setResendTimer(RESEND_SECONDS);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!otpSent) return handleSendOtp();
    if (!/^\d{6}$/.test(otp)) return setLocalError("Enter the 6-digit code sent to your email.");

    const result = await dispatch(verifyVendorOtp({ email: email.trim(), otp }));
    if (verifyVendorOtp.fulfilled.match(result)) {
      setEmail("");
      setOtp("");
      goHome(result.payload);
    }
  };

  const shownError = localError || error;
  const spinner = (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  return (
    <SellerAuthShell>
      <div className="mb-6">
        <div className="hidden md:block mb-3">
          <VendorPortalBadge />
        </div>
        <h1 className="text-2xl font-extrabold text-vendor-dark tracking-tight">Vendor Login</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your products, orders &amp; store catalog</p>
      </div>

      {/* Login mode tabs — app: tabContainer / tabButtonActive */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-5 bg-slate-100 rounded-[10px]" role="tablist">
        {(
          [
            ["password", "Password Login", Lock],
            ["otp", "OTP Login", Smartphone],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = mode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchMode(key)}
              className={`h-10 rounded-lg flex items-center justify-center gap-1.5 text-[13px] transition-all cursor-pointer ${
                active
                  ? "bg-white text-vendor-dark font-bold shadow-sm"
                  : "text-slate-500 font-semibold hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {shownError && (
        <div className={`${sellerErrorBox} mb-4`}>
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-medium">{shownError}</span>
        </div>
      )}
      {!shownError && mode === "otp" && otpSent && successMessage && (
        <div className={`${sellerSuccessBox} mb-4`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="v-email" className={sellerLabel}>Vendor Email Address</label>
            <div className="relative">
              <Mail className={sellerInputIcon} />
              <input
                id="v-email"
                type="email"
                autoComplete="email"
                placeholder="vendor@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={sellerInputWithIcon}
              />
            </div>
          </div>

          <div>
            <label htmlFor="v-pass" className={sellerLabel}>Password</label>
            <div className="relative">
              <Lock className={sellerInputIcon} />
              <input
                id="v-pass"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter vendor password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${sellerInputWithIcon} pr-10`}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me + forgot — app: optionsRow */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setRememberMe((v) => !v)}
              className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none"
              aria-pressed={rememberMe}
            >
              <span
                className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center ${
                  rememberMe ? "bg-vendor-dark border-vendor-dark" : "bg-white border-slate-400"
                }`}
              >
                {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              Remember me
            </button>
            <button type="button" onClick={() => switchMode("otp")} className={sellerLink}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={isLoading} className={sellerPrimaryBtn}>
            {isLoading ? spinner : "Login to Vendor Portal"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          {!otpSent ? (
            <div>
              <label htmlFor="v-otp-email" className={sellerLabel}>Registered Vendor Email</label>
              <div className="relative">
                <Mail className={sellerInputIcon} />
                <input
                  id="v-otp-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vendor@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={sellerInputWithIcon}
                />
              </div>
              <p className={sellerHelper}>
                We will send a 6-digit one-time code to your registered email.
              </p>
            </div>
          ) : (
            <>
              {/* app: otpHeaderBox */}
              <div className="text-center">
                <p className="text-sm font-bold text-vendor-dark">Enter Verification Code</p>
                <p className="text-xs text-slate-500 mt-1">
                  6-digit code sent to <span className="font-bold text-slate-800">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    dispatch(clearVendorAlerts());
                  }}
                  className={`${sellerLink} mt-1`}
                >
                  Change Email
                </button>
              </div>

              <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

              <div className="text-center text-xs text-slate-500">
                {resendTimer > 0 ? (
                  <>
                    Resend code in <span className="font-bold text-vendor-dark">{resendTimer}s</span>
                  </>
                ) : (
                  <button type="button" onClick={handleSendOtp} disabled={isLoading} className={sellerLink}>
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          <button type="submit" disabled={isLoading} className={sellerPrimaryBtn}>
            {isLoading ? spinner : otpSent ? "Verify & Login" : "Send Login OTP"}
          </button>
        </form>
      )}

      {/* Divider + onboarding card — app: dividerRow / registerCard */}
      <div className="flex items-center gap-2.5 my-6">
        <span className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Seller Community
        </span>
        <span className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 text-center">
        <p className="text-sm font-bold text-vendor-dark">Want to sell on BhansaMart?</p>
        <p className="text-xs text-slate-500 mt-1 mb-3.5 leading-4">
          Expand your grocery or restaurant business to thousands of customers.
        </p>
        <Link href="/seller/register" className={sellerOutlineBtn}>
          <Store className="w-4.5 h-4.5" />
          Start Seller Onboarding
        </Link>
      </div>

    </SellerAuthShell>
  );
}
