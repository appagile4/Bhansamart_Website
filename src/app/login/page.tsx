"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector, useHydrated } from "@/redux/hooks";
import {
  sendCustomerOtp,
  verifyCustomerOtp,
  completeCustomerRegistration,
  loginCustomerPassword,
  loginCustomerGoogle,
  clearAuthError,
} from "@/redux/slices/authSlice";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function CustomerLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, successMessage } = useAppSelector(
    (state) => state.auth
  );
  const hydrated = useHydrated();

  // Authentication Mode
  // primaryMode: "choice" | "email"
  const [primaryMode, setPrimaryMode] = useState<"choice" | "email">("choice");
  // emailMethod: "otp" | "password"
  const [emailMethod, setEmailMethod] = useState<"otp" | "password">("otp");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(60);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mandatory New Customer Password Setup Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [modalError, setModalError] = useState("");

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  // Clear errors on initial render
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Navigate on successful login
  useEffect(() => {
    if (hydrated && isAuthenticated) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [hydrated, isAuthenticated, router]);

  // ── Handlers ────────────────────────────────────────────────────────

  // Send Email OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    try {
      const res = await dispatch(
        sendCustomerOtp({ email: email.trim(), purpose: "login" })
      ).unwrap();

      setOtpSent(true);
      setResendTimer(res?.data?.resendCooldown || 60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setFormError(typeof err === "string" ? err : "Failed to send verification code.");
    }
  };

  // OTP Digit Change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit when 6 digits filled
    if (newDigits.every((d) => d !== "") && index === 5) {
      handleVerifyOtp(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setFormError("");
    const finalCode = codeToVerify || otpDigits.join("");

    if (finalCode.length !== 6) {
      setFormError("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const res = await dispatch(
        verifyCustomerOtp({ email: email.trim(), otp: finalCode })
      ).unwrap();

      if (res?.isNewCustomer && res?.requiresPasswordSetup) {
        // Open mandatory password setup modal for new customer
        setRegistrationToken(res?.data?.registrationToken);
        setShowPasswordModal(true);
      }
    } catch (err: any) {
      setFormError(typeof err === "string" ? err : "Invalid or expired verification code.");
    }
  };

  // Complete Password Setup for New Customer
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!newPassword || newPassword.length < 6) {
      setModalError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!registrationToken) {
      setModalError("Registration session expired. Please verify OTP again.");
      setShowPasswordModal(false);
      return;
    }

    try {
      await dispatch(
        completeCustomerRegistration({
          registrationToken,
          password: newPassword,
          confirmPassword,
        })
      ).unwrap();

      setShowPasswordModal(false);
    } catch (err: any) {
      setModalError(
        typeof err === "string" ? err : "Failed to set password and create account."
      );
    }
  };

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setFormError("Please enter your password.");
      return;
    }

    try {
      await dispatch(
        loginCustomerPassword({ email: email.trim(), password })
      ).unwrap();
    } catch (err: any) {
      setFormError(typeof err === "string" ? err : "Invalid email or password.");
    }
  };

  // Google OAuth Login
  const handleGoogleCredentialResponse = (response: any) => {
    if (response?.credential) {
      dispatch(loginCustomerGoogle(response.credential));
    }
  };

  // Initialize Google One Tap / Button when GSI loads
  useEffect(() => {
    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "885243883462-eevrcd81b7fpv375elbelgbcotpfklpf.apps.googleusercontent.com";

    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });

        const renderGsi = (id: string) => {
          const btnContainer = document.getElementById(id);
          if (btnContainer) {
            (window as any).google.accounts.id.renderButton(btnContainer, {
              theme: "outline",
              size: "large",
              width: 380,
              text: "continue_with",
              shape: "pill",
            });
          }
        };
        renderGsi("google-signin-btn-container");
        renderGsi("google-signin-btn-container-email");
      } catch (err) {
        console.warn("Google Sign-In initialization:", err);
      }
    }
  }, [primaryMode]);

  return (
    <>
      {/* Load Google Identity Services */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          const clientId =
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "885243883462-eevrcd81b7fpv375elbelgbcotpfklpf.apps.googleusercontent.com";
          if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse,
            });
            const renderGsi = (id: string) => {
              const btnContainer = document.getElementById(id);
              if (btnContainer) {
                (window as any).google.accounts.id.renderButton(btnContainer, {
                  theme: "outline",
                  size: "large",
                  width: 380,
                  text: "continue_with",
                  shape: "pill",
                });
              }
            };
            renderGsi("google-signin-btn-container");
            renderGsi("google-signin-btn-container-email");
          }
        }}
      />

      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
        <div className="w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col items-center">
          
          {/* ── BhansaMart Cart Logo ── */}
          <Link href="/" className="mb-4 focus:outline-none" title="BhansaMart Home">
            <img
              src="/images/bhansamart-cart-logo.png"
              alt="BhansaMart"
              className="h-16 w-auto object-contain"
            />
          </Link>

          {/* ── Welcome Heading ── */}
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
            Sign in to BhansaMart
          </h1>
          <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
            Fresh groceries & daily kitchen essentials delivered in minutes
          </p>

          {/* ── Alerts ── */}
          {formError || error ? (
            <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <span>{formError || error}</span>
                {/* Helpful prompt if user has no password or unregistered */}
                {(formError || error)?.includes("Email OTP") && emailMethod === "password" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMethod("otp");
                      setFormError("");
                    }}
                    className="block mt-1 font-bold text-teal-700 underline text-xs"
                  >
                    Switch to Email OTP Login &rarr;
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {successMessage ? (
            <div className="w-full mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}! Redirecting...</span>
            </div>
          ) : null}

          {/* ── Primary Authentication Buttons (Stacked Pill UI in App Theme) ── */}
          {primaryMode === "choice" && (
            <div className="w-full flex flex-col gap-3.5 mb-6">
              {/* Button 1: Continue with Email (Solid Teal Pill) */}
              <button
                type="button"
                onClick={() => {
                  setPrimaryMode("email");
                  setFormError("");
                }}
                className="w-full py-3.5 px-6 bg-[#008080] hover:bg-[#006666] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Mail className="w-5 h-5 text-white" />
                <span>Continue with Email</span>
              </button>

              {/* Button 2: Continue with Google (White Pill with Outline) */}
              <div
                id="google-signin-btn-container"
                className="w-full flex justify-center min-h-[46px]"
              />
            </div>
          )}

          {/* ══════════════ EMAIL MODE ══════════════ */}
          {primaryMode === "email" && (
            <div className="w-full">
              {/* Back to all options */}
              <button
                type="button"
                onClick={() => {
                  setPrimaryMode("choice");
                  setOtpSent(false);
                  setFormError("");
                }}
                className="flex items-center gap-2 text-xs font-bold text-[#008080] hover:underline mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All sign-in options</span>
              </button>

              {/* Email Sub-method Tabs */}
              <div className="flex border-b border-slate-200 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMethod("otp");
                    setFormError("");
                  }}
                  className={`pb-2.5 px-4 text-xs font-bold transition relative ${
                    emailMethod === "otp"
                      ? "text-[#008080] border-b-2 border-[#008080]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailMethod("password");
                    setFormError("");
                  }}
                  className={`pb-2.5 px-4 text-xs font-bold transition relative ${
                    emailMethod === "password"
                      ? "text-[#008080] border-b-2 border-[#008080]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Email & Password
                </button>
              </div>

              {/* ── Sub-path A: Email OTP ── */}
              {emailMethod === "otp" && (
                <div>
                  {!otpSent ? (
                    /* Step A1: Enter Email */
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Email address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#008080] hover:bg-[#006666] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Send Verification Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                        We will send a 6-digit one-time password to your email. Existing customers log in directly; new customers will set a password next.
                      </p>
                    </form>
                  ) : (
                    /* Step A2: Enter 6-digit OTP */
                    <div className="space-y-5">
                      <div className="text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 mb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Code sent to {email}
                        </span>
                        <p className="text-xs text-slate-600">
                          Please enter the 6-digit verification code below:
                        </p>
                      </div>

                      {/* 6 Digit Input Boxes */}
                      <div className="flex justify-between gap-1.5 sm:gap-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-12 h-14 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-extrabold text-[#008080] bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#008080] focus:bg-white focus:outline-none transition shadow-inner"
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        disabled={loading || otpDigits.some((d) => d === "")}
                        className="w-full py-3 bg-[#008080] hover:bg-[#006666] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Verify & Sign In</span>
                        )}
                      </button>

                      {/* Resend & Change Email Row */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setFormError("");
                          }}
                          className="text-slate-500 hover:text-slate-800 underline"
                        >
                          Change email
                        </button>

                        <button
                          type="button"
                          disabled={resendTimer > 0 || loading}
                          onClick={() => handleSendOtp()}
                          className={`font-semibold flex items-center gap-1 ${
                            resendTimer > 0
                              ? "text-slate-400 cursor-not-allowed"
                              : "text-[#008080] hover:underline cursor-pointer"
                          }`}
                        >
                          {resendTimer > 0 ? (
                            <span>Resend in {resendTimer}s</span>
                          ) : (
                            <span>Resend Code</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-path B: Email & Password ── */}
              {emailMethod === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailMethod("otp");
                          setFormError("");
                        }}
                        className="text-[11px] font-semibold text-[#008080] hover:underline"
                      >
                        Sign in with OTP instead?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#008080] hover:bg-[#006666] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OR Divider & Alternate Google Login */}
              <div className="w-full flex items-center my-5">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3 text-xs text-slate-400 font-medium">OR</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <div
                id="google-signin-btn-container-email"
                className="w-full flex justify-center min-h-[44px]"
              />
            </div>
          )}

          {/* ── Footer Info ── */}
          <div className="w-full border-t border-slate-100 mt-6 pt-4 text-center">
            <p className="text-[11px] text-slate-400">
              BhansaMart &copy; {hydrated ? new Date().getFullYear() : null} &middot; Customer Portal
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════ MANDATORY NEW CUSTOMER PASSWORD MODAL ══════════════ */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-[420px] p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#008080]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Set Your Password
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory for your new BhansaMart account
                </p>
              </div>
            </div>

            <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl mb-4 text-xs text-teal-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#008080] shrink-0 mt-0.5" />
              <span>
                Your email <strong>{email}</strong> is verified! Create a password so you can sign in anytime using either Email OTP or Password.
              </span>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-[#008080] hover:bg-[#006666] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Complete Account Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
