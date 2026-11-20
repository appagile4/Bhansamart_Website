"use client";
/* Super Admin UI kit — same building blocks as the Seller Hub, in the app's admin sky-blue (#0284C7). */

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Inbox, Loader2, RefreshCw, X } from "lucide-react";
import type { Badge } from "@/lib/seller/format";

/** Page title row — app: screen title bar / top nav */
export function PageHeader({
  title,
  subtitle,
  backHref,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {backHref && (
          <Link href={backHref} className="mt-0.5 p-2 rounded-xl bg-white border border-slate-200 text-sky-600 hover:bg-sky-50 shrink-0" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
          {title && <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "teal",
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ElementType;
  tone?: "teal" | "amber" | "green" | "red" | "violet" | "blue" | "slate";
  href?: string;
}) {
  const tones: Record<string, string> = {
    teal: "bg-sky-50 text-[#0284C7] border border-sky-100",
    amber: "bg-amber-50 text-amber-600 border border-amber-100",
    green: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    red: "bg-red-50 text-red-600 border border-red-100",
    violet: "bg-purple-50 text-purple-600 border border-purple-100",
    blue: "bg-blue-50 text-blue-600 border border-blue-100",
    slate: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  const body = (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 h-full flex items-start justify-between gap-3 hover:border-sky-300 transition-colors">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1.5 text-xl md:text-2xl font-extrabold text-slate-900 truncate">{value}</p>
        {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
      </div>
      {Icon && (
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Pill({ badge, className = "" }: { badge: Badge; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${badge.cls} ${className}`}>
      {badge.label}
    </span>
  );
}

/** Horizontal filter tabs — app: filter chips / tab bars */
export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: ReadonlyArray<{ key: K; label: string }>;
  active: K;
  onChange: (key: K) => void;
  counts?: Partial<Record<K, number>>;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist">
      {tabs.map((t) => {
        const on = t.key === active;
        const count = counts?.[t.key];
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              on ? "bg-[#0284C7] border-[#0284C7] text-white shadow-sm shadow-sky-600/15" : "bg-white border-slate-200 text-slate-600 hover:border-[#0284C7] hover:text-[#0284C7]"
            }`}
          >
            {t.label}
            {count !== undefined && (
              <span className={`min-w-5 px-1.5 rounded-full text-[10px] ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, text, action, icon: Icon = Inbox }: { title: string; text?: string; action?: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="py-14 px-6 text-center flex flex-col items-center">
      <span className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </span>
      <p className="text-sm font-extrabold text-slate-800">{title}</p>
      {text && <p className="text-xs text-slate-500 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-2" role="status">
      <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700" role="alert">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="flex-1 font-medium">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 font-bold hover:underline cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800" role="status">
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[55] bg-slate-900/50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div
        className={`w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold shadow-sm shadow-sky-600/15 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]",
  outline:
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white border border-[#0284C7] text-[#0284C7] text-sm font-bold hover:bg-sky-50 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]",
  ghost:
    "inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60",
  danger:
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 text-sm font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]",
  dangerSolid:
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm shadow-red-600/15 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]",
  success:
    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white text-sm font-bold shadow-sm shadow-emerald-600/15 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]",
};

export const field =
  "w-full h-10 bg-white text-sm text-slate-900 px-3 rounded-xl border border-slate-200 focus:border-[#0284C7] focus:ring-2 focus:ring-sky-100 focus:outline-none transition-all placeholder:text-slate-400";
export const fieldLabel = "block text-xs font-bold text-slate-700 mb-1.5";
