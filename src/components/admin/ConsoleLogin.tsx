"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { adminLogin, errorText } from "@/lib/admin/api";
import { saveAdminSession, saveStaffAdminSession, useAdminSession, useStaffAdminSession } from "@/lib/admin/session";

const input =
  "w-full h-11 bg-white text-sm text-slate-900 pl-10 pr-3 rounded-lg border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 focus:outline-none placeholder:text-slate-400";

export interface ConsoleLoginConfig {
  /** Role allowed into this console: "superadmin" or "admin" (staff admin) */
  role: "superadmin" | "admin";
  dashboardHref: string;
  badge: string;
  heading: string;
  blurb: string;
  /** Message shown when the other admin role signs in here */
  wrongRoleMessage: string;
}

/** Shared admin console login — app: (auth)/admin-login.tsx (which routes by role). */
export default function ConsoleLogin({ cfg }: { cfg: ConsoleLoginConfig }) {
  const router = useRouter();
  const superSession = useAdminSession();
  const staffSession = useStaffAdminSession();
  const session = cfg.role === "superadmin" ? superSession : staffSession;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in as super admin → straight to the console
  useEffect(() => {
    if (session?.user?.role === cfg.role) router.replace(cfg.dashboardHref);
  }, [session, router, cfg.role, cfg.dashboardHref]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError("Please enter your administrative email and password.");
    setBusy(true);
    try {
      const { token, user } = await adminLogin(email.trim().toLowerCase(), password);
      if (user.role === "admin" || user.role === "superadmin") {
        if (user.role !== cfg.role) return setError(cfg.wrongRoleMessage);
      } else {
        return setError("This account does not have administrative privileges.");
      }
      if (cfg.role === "superadmin") saveAdminSession(token, user);
      else saveStaffAdminSession(token, user);
      setEmail("");
      setPassword("");
      router.replace(cfg.dashboardHref);
    } catch (err) {
      setError(errorText(err, "Invalid administrative credentials."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white font-sans text-slate-900">
      <aside className="hidden lg:flex h-screen sticky top-0 bg-gradient-to-br from-slate-900 via-sky-900 to-sky-700 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <span className="relative z-10 inline-flex items-center gap-3">
          <span className="relative block w-[150px] h-[46px] overflow-hidden rounded-lg bg-white">
            <Image src="/images/seller/vendor-banner-logo.png" alt="BhansaMart" fill sizes="150px" className="object-cover" priority />
          </span>
          <span className="text-[11px] font-extrabold tracking-[0.15em] text-sky-200">ADMIN CONSOLE</span>
        </span>
        <div className="relative z-10">
          <span className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-sky-200" />
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight max-w-md">{cfg.heading}</h1>
          <p className="mt-3 text-sm text-sky-100/90 max-w-md">{cfg.blurb}</p>
        </div>
        <p className="relative z-10 text-[11px] text-sky-100/70">Restricted area. All administrative actions are recorded in the audit log.</p>
      </aside>

      <main className="min-h-screen flex items-center justify-center px-4 sm:px-8 py-10 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
            <span className="text-sm font-extrabold tracking-wide text-slate-900">BhansaMart Admin Console</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] font-extrabold tracking-[0.08em] border border-sky-100">
            <ShieldCheck className="w-3.5 h-3.5" /> {cfg.badge}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Administrative Sign In</h2>
          <p className="text-sm text-slate-500 mt-1">Use your BhansaMart administrator account.</p>

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <label className="block">
              <span className="block text-[13px] font-bold text-slate-900 mb-1.5">Admin Email</span>
              <span className="relative block">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="email" autoComplete="username" className={input} placeholder="admin@bhansamart.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </span>
            </label>
            <label className="block">
              <span className="block text-[13px] font-bold text-slate-900 mb-1.5">Password</span>
              <span className="relative block">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type={show ? "text" : "password"} autoComplete="current-password" className={`${input} pr-10`} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </span>
            </label>
            <button type="submit" disabled={busy} className="w-full h-11 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold flex items-center justify-center cursor-pointer disabled:opacity-60">
              {busy ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Sign In to Console"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
