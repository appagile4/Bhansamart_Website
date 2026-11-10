"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { registerUser, clearAuthError } from "@/redux/slices/authSlice";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, successMessage } = useAppSelector(
    (state) => state.auth
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthMonth, setBirthMonth] = useState("01");
  const [birthDay, setBirthDay] = useState("01");
  const [birthYear, setBirthYear] = useState("2000");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setFormError("Please enter a valid email");
      return;
    }
    if (!gender) {
      setFormError("Please select your gender");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[\W_]/.test(password)
    ) {
      setFormError(
        "Password must contain an uppercase letter, lowercase letter, number, and special character"
      );
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Confirm password does not match password");
      return;
    }

    const dateOfBirth = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`;

    dispatch(
      registerUser({
        name: name.trim(),
        email: email.trim(),
        address: address.trim() || undefined,
        dateOfBirth,
        gender,
        password,
        confirmPassword,
      })
    );
  };

  const months = [
    { label: "January", value: "01" },
    { label: "February", value: "02" },
    { label: "March", value: "03" },
    { label: "April", value: "04" },
    { label: "May", value: "05" },
    { label: "June", value: "06" },
    { label: "July", value: "07" },
    { label: "August", value: "08" },
    { label: "September", value: "09" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const years = Array.from({ length: 70 }, (_, i) => String(2020 - i));

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-[440px] mx-auto flex flex-col items-center">
        
        {/* ── BhansaMart Cart Logo ── */}
        <Link href="/" className="mb-5 focus:outline-none" title="BhansaMart Home">
          <img
            src="/images/bhansamart-cart-logo.png"
            alt="BhansaMart"
            className="h-20 w-auto object-contain"
          />
        </Link>

        {/* ── Create an Account Title ── */}
        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight text-center mb-6">
          Create an Account
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
            <span>{successMessage}! Redirecting to store...</span>
          </div>
        ) : null}

        {/* ── Registration Form (Clean Underlined Style) ── */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          
          {/* Name */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0B4D58] transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0B4D58] transition"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Baneshwor, Kathmandu / Dwarka, Delhi"
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0B4D58] transition"
            />
          </div>

          {/* Date of birth (Month, Day, Year Dropdowns) */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Date of birth</label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B4D58] cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B4D58] cursor-pointer"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B4D58] cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:border-[#0B4D58] cursor-pointer"
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 special char"
              required
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0B4D58] transition"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full pb-2 border-b border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#0B4D58] transition"
            />
          </div>

          {/* Sign up Button (Dark Teal) */}
          <button
            type="submit"
            disabled={loading || isAuthenticated}
            className="w-full py-3.5 bg-[#0B4D58] hover:bg-[#083C45] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 focus:outline-none mt-4"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{loading ? "Creating Account..." : "Sign up"}</span>
          </button>
        </form>

        {/* ── OR Divider ── */}
        <div className="w-full flex items-center my-4">
          <div className="flex-1 border-t border-slate-200" />
          <span className="px-3 text-xs text-slate-400 font-medium">OR</span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {/* ── Sign up with Google ── */}
        <button
          type="button"
          onClick={() => alert("Google Sign Up: You can sign up with email and password.")}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-center gap-3 transition shadow-xs focus:outline-none cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* ── Switch to Sign in ── */}
        <p className="text-xs text-slate-600 mt-5 text-center">
          Already have an Account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#0B4D58] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
