"use client";

import React, { useEffect, useState } from "react";
import { getStorageRecharges } from "@/lib/admin/api";
import {
  BadgeCheck,
  Banknote,
  Bike,
  FileText,
  HardDrive,
  Landmark,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Package,
  Radar,
  RotateCcw,
  Store,
  Ticket,
  UserCog,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { clearAdminSession, useAdminSession } from "@/lib/admin/session";
import ConsoleShell, { type ConsoleConfig } from "./ConsoleShell";
import StorageRechargePopup, { ADMIN_STORAGE_CHANGED_EVENT } from "./StorageRechargePopup";

const A = "/admin/dashboard";


/** Pending storage-recharge requests waiting for super admin verification (polled every 60 s). */
function PendingStorageBadge({ compact }: { compact: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      getStorageRecharges({ status: "PENDING", limit: 1 })
        .then((r) => alive && setCount(r.total || 0))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    window.addEventListener(ADMIN_STORAGE_CHANGED_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener(ADMIN_STORAGE_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  if (!count) return null;
  const text = count > 99 ? "99+" : String(count);
  return compact ? (
    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center" aria-label={`${count} pending storage recharges`}>
      {text}
    </span>
  ) : (
    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center" title="Storage recharges awaiting verification">
      {text}
    </span>
  );
}

/** Same entries & order as the app's AdminSideMenu (components/AdminSideMenu.tsx) */
const MENU: ConsoleConfig["menu"] = [
  { label: "Dashboard", href: A, icon: LayoutDashboard },
  { label: "Vendors & KYC", href: `${A}/vendors`, icon: Store },
  { label: "Staff Admins", href: `${A}/staff-admins`, icon: UserCog },
  { label: "Catalog & Products", href: `${A}/catalog`, icon: Package },
  { label: "Vendor Storage", href: `${A}/storage`, icon: HardDrive, Badge: PendingStorageBadge },
  { label: "Vendor Sales Analytics", href: `${A}/vendor-analytics`, icon: LineChart },
  { label: "Returns & Refund Claims", href: `${A}/refunds`, icon: RotateCcw },
  { label: "Brand Review Queue", href: `${A}/brands`, icon: BadgeCheck },
  { label: "Withdrawal Requests", href: `${A}/withdrawals`, icon: Banknote },
  { label: "Financial Ledger (1.5%)", href: `${A}/finance`, icon: Wallet },
  { label: "Platform Bank & Limits", href: `${A}/bank-config`, icon: Landmark },
  { label: "Customer Directory", href: `${A}/customers`, icon: Users },
  { label: "Delivery Partners & COD", href: `${A}/delivery`, icon: Bike },
  { label: "Support Tickets", href: `${A}/tickets`, icon: Ticket },
  { label: "Broadcast Notifications", href: `${A}/notifications`, icon: Megaphone },
  { label: "Live Fleet Radar", href: `${A}/map`, icon: Radar },
  { label: "Audit Logs", href: `${A}/audit-logs`, icon: FileText },
  { label: "Admin Profile & System", href: `${A}/profile`, icon: UserRound },
];

const CONFIG: ConsoleConfig = {
  role: "superadmin",
  base: A,
  loginHref: "/admin/login",
  badge: "SUPER ADMIN",
  roleLabel: "SUPERADMIN",
  consoleName: "Super Admin Console",
  headerSubtitle: "BhansaMart Platform Administration",
  menu: MENU,
  useSession: useAdminSession,
  clearSession: clearAdminSession,
};

/** Super Admin console shell — mounted once by app/admin/dashboard/layout.tsx */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleShell cfg={CONFIG}>
      {children}
      <StorageRechargePopup />
    </ConsoleShell>
  );
}
