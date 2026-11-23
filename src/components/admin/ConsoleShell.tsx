"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import type { AdminSession } from "@/lib/admin/session";
import { getAdminMe } from "@/lib/admin/api";
import { initials } from "@/lib/seller/format";

export interface ConsoleMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Optional section heading shown above this item */
  section?: string;
  /** Optional live badge (e.g. pending count); renders nothing when there is nothing to show */
  Badge?: React.ComponentType<{ compact: boolean }>;
}

export interface ConsoleConfig {
  /** Role allowed in this console: "superadmin" or "admin" (staff admin) */
  role: "superadmin" | "admin";
  base: string;
  loginHref: string;
  badge: string;
  roleLabel: string;
  consoleName: string;
  headerSubtitle: string;
  menu: ConsoleMenuItem[];
  useSession: () => AdminSession | null | undefined;
  clearSession: () => void;
}

/** Admin console shell (sidebar + header + session guard), shared by the Super Admin and Staff Admin consoles. */
export default function ConsoleShell({ cfg, children }: { cfg: ConsoleConfig; children: React.ReactNode }) {
  const A = cfg.base;
  const MENU = cfg.menu;
  const router = useRouter();
  const pathname = usePathname();
  const session = cfg.useSession();
  // useSession is `undefined` on the server and during hydration, so this is false until mounted
  const mounted = session !== undefined;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const allowed = session?.user?.role === cfg.role;

  // Guard: unknown during hydration; signed out or wrong role → this console's login
  useEffect(() => {
    if (!mounted || session === undefined) return;
    if (!session || !allowed) router.replace(cfg.loginHref);
  }, [mounted, session, allowed, router, cfg.loginHref]);

  // Re-validate the stored token once per session (a 401 clears it → guard redirects)
  useEffect(() => {
    if (!mounted || !session?.token || !allowed) return;
    getAdminMe()
      .then((u) => {
        if (u?.role !== cfg.role) cfg.clearSession();
      })
      .catch(() => {
        /* network issues keep the session; 401 is handled by the API client */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per token
  }, [mounted, session?.token, allowed]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Mobile drawer: lock page scroll behind it, close on Escape, and close if the screen grows to desktop
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [mobileOpen]);

  const logout = () => {
    cfg.clearSession();
    router.replace(cfg.loginHref);
  };

  const ready = mounted && Boolean(session && allowed);
  const active = (href: string) => (href === A ? pathname === A : pathname === href || pathname.startsWith(`${href}/`));
  const labels = !collapsed || mobileOpen;
  const current = MENU.find((m) => active(m.href));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* The page is always rendered (Next.js validates/prerenders it); this covers it until the session is confirmed */}
      {!ready && (
        <div className="fixed inset-0 z-[90] bg-slate-50 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <ShieldCheck className="w-10 h-10 text-sky-600 animate-pulse" />
          <p className="text-sm font-semibold text-slate-600">Loading {cfg.consoleName}…</p>
        </div>
      )}

      {mobileOpen && <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside
        className={`bg-slate-900 text-slate-300 flex flex-col z-50 h-screen transition-all duration-300 fixed inset-y-0 left-0 w-72 max-w-[85vw] lg:max-w-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:top-0 lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
        aria-label="Admin navigation"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <Link href={A} className="flex items-center gap-2.5 overflow-hidden" onClick={() => setMobileOpen(false)}>
            <span className="relative w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0">
              <Image src="/images/seller/vendor-cart-badge.png" alt="BhansaMart" fill sizes="36px" className="object-cover scale-[1.45]" priority />
            </span>
            {labels && (
              <span className="leading-tight">
                <span className="block text-sm font-extrabold text-white">BhansaMart</span>
                <span className="block text-[10px] font-bold tracking-[0.12em] text-sky-300">{cfg.badge}</span>
              </span>
            )}
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 cursor-pointer" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar">
          {labels && <p className="px-3 mb-2 text-[10px] font-bold tracking-[0.12em] text-slate-500">MAIN</p>}
          {MENU.map(({ label, href, icon: Icon, section, Badge }) => {
            const on = active(href);
            return (
              <React.Fragment key={href}>
              {section && labels && <p className="px-3 pt-4 mb-2 text-[10px] font-bold tracking-[0.12em] text-slate-500">{section}</p>}
              <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                title={!labels ? label : undefined}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  on ? "bg-[#0284C7] text-white font-semibold shadow-sm shadow-sky-600/20" : "hover:bg-white/5 hover:text-white"
                } ${labels ? "" : "justify-center"}`}
              >
                <span className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {Badge && !labels && <Badge compact />}
                </span>
                {labels && <span className="truncate">{label}</span>}
                {Badge && labels && <Badge compact={false} />}
              </Link>
              </React.Fragment>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-300 hover:bg-red-500/10 cursor-pointer ${labels ? "" : "justify-center"}`}
            title={!labels ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {labels && "Logout"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => (window.matchMedia("(min-width: 1024px)").matches ? setCollapsed((c) => !c) : setMobileOpen(true))}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-slate-900 truncate">{current?.label || cfg.consoleName}</p>
                <span className="hidden min-[400px]:inline px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#E0F2FE] text-[#0369A1] uppercase tracking-wider shrink-0">
                  {cfg.roleLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{cfg.headerSubtitle}</p>
            </div>
          </div>

          <div className="relative shrink-0" ref={profileRef}>
            <button type="button" onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer" aria-expanded={profileOpen} aria-label="Account menu">
              <span className="w-9 h-9 rounded-full bg-[#0284C7] text-white font-bold text-sm flex items-center justify-center shadow-sm shadow-sky-600/20">
                {mounted ? initials(session?.user?.name || "Admin") : "AD"}
              </span>
              <span className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                  {mounted ? (session?.user?.name || cfg.consoleName) : cfg.consoleName}
                </span>
                <span className="text-[10px] font-bold text-[#0284C7] tracking-wide">{cfg.roleLabel}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{session?.user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{session?.user?.email}</p>
                </div>
                <Link href={`${A}/profile`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  <UserRound className="w-4 h-4 text-slate-400" /> {MENU.find((m) => m.href === `${A}/profile`)?.label || "Profile"}
                </Link>
                <button type="button" onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 text-left cursor-pointer">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 w-full min-w-0 px-3 py-4 sm:p-4 md:p-6 lg:p-8">
          {/* Caps line length on very wide screens so cards and tables don't stretch edge to edge */}
          <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
