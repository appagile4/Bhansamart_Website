"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, Banknote, ChevronRight, Megaphone, Package, RotateCcw, ShieldCheck, ShoppingBag, Ticket } from "lucide-react";
import { STAFF_BASE as S } from "@/lib/admin/console";
import { PageHeader } from "@/components/admin/ui";

// app: StaffAdminMain/operations.tsx — operational task workflows
const MODULES = [
  { title: "Returns & Refund Claims", subtitle: "Vendor-accepted returns lifecycle, examination & payout notes", badge: "8-Step Lifecycle", href: `${S}/refunds`, icon: RotateCcw, tone: "bg-violet-50 text-violet-600" },
  { title: "Brand Submission Queue", subtitle: "Review store brand name, logo, certification docs & permissions", badge: "Verification", href: `${S}/brands`, icon: BadgeCheck, tone: "bg-sky-50 text-sky-600" },
  { title: "Withdrawal Requests", subtitle: "Inspect vendor requested amount, ledger history & escalate to Superadmin", badge: "Escalation", href: `${S}/withdrawals`, icon: Banknote, tone: "bg-amber-50 text-amber-600" },
  { title: "Vendor Support Tickets", subtitle: "Communicate directly with store owners, view attachments & replies", badge: "Inquiries", href: `${S}/tickets`, icon: Ticket, tone: "bg-rose-50 text-rose-600" },
  { title: "Product Moderation", subtitle: "Inspect assigned store products, stock status, pricing & approvals", badge: "Inventory", href: `${S}/products`, icon: Package, tone: "bg-emerald-50 text-emerald-600" },
  { title: "Orders Tracking & Fulfillment", subtitle: "View scoped orders, customer addresses, rider status & live updates", badge: "Orders", href: `${S}/orders`, icon: ShoppingBag, tone: "bg-blue-50 text-blue-600" },
  { title: "Vendor Broadcast Notifications", subtitle: "Dispatch announcements, alerts & urgent notices with role-based targeting", badge: "Broadcast", href: `${S}/broadcasts`, icon: Megaphone, tone: "bg-indigo-50 text-indigo-600" },
];

export default function StaffOperationsPage() {
  return (
    <>
      <PageHeader title="Operations" subtitle="Operational task workflows for your assigned stores" />
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        {MODULES.map((m) => (
          <Link key={m.title} href={m.href} className="bg-white rounded-2xl border border-slate-200/80 p-4.5 flex items-start gap-3.5 hover:border-sky-300 transition-all shadow-sm">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.tone}`}><m.icon className="w-5 h-5" /></span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-slate-900">{m.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{m.badge}</span>
              </span>
              <span className="block text-xs text-slate-500 mt-1">{m.subtitle}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-slate-300 mt-1" />
          </Link>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-[#0284C7]" /> All actions and reviews are logged to the platform audit trail and visible to the Super Admin.
      </p>
    </>
  );
}
