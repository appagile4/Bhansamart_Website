"use client";

import React from "react";
import {
  BadgeCheck,
  Banknote,
  Bell,
  Bike,
  Briefcase,
  HandCoins,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Package,
  Radar,
  RotateCcw,
  ShoppingBag,
  Store,
  Ticket,
  Truck,
  UserRound,
} from "lucide-react";
import { clearStaffAdminSession, useStaffAdminSession } from "@/lib/admin/session";
import { STAFF_BASE as S } from "@/lib/admin/console";
import ConsoleShell, { type ConsoleConfig, type ConsoleMenuItem } from "./ConsoleShell";

/**
 * Staff Admin menu — the app's StaffAdminMain tabs (Home, Vendors, Operations, Deliveries, Profile)
 * plus the screens those tabs open (Screens/staffadminScreens/*), so each is one click away on web.
 */
const MENU: ConsoleMenuItem[] = [
  { label: "Home", href: S, icon: LayoutDashboard },
  { label: "Assigned Stores", href: `${S}/vendors`, icon: Store },
  { label: "Operations", href: `${S}/operations`, icon: Briefcase },
  { label: "Deliveries", href: `${S}/deliveries`, icon: Truck },
  { label: "Notifications", href: `${S}/notifications`, icon: Bell },
  { label: "Returns & Refund Claims", href: `${S}/refunds`, icon: RotateCcw, section: "OPERATIONS" },
  { label: "Brand Submission Queue", href: `${S}/brands`, icon: BadgeCheck },
  { label: "Withdrawal Requests", href: `${S}/withdrawals`, icon: Banknote },
  { label: "Vendor Support Tickets", href: `${S}/tickets`, icon: Ticket },
  { label: "Product Moderation", href: `${S}/products`, icon: Package },
  { label: "Orders Tracking", href: `${S}/orders`, icon: ShoppingBag },
  { label: "Sales Analytics", href: `${S}/analytics`, icon: LineChart },
  { label: "Vendor Broadcasts", href: `${S}/broadcasts`, icon: Megaphone },
  { label: "Delivery Fleet & COD", href: `${S}/delivery`, icon: Bike, section: "DELIVERIES" },
  { label: "COD Reconciliation", href: `${S}/cod`, icon: HandCoins },
  { label: "Live Fleet Radar", href: `${S}/map`, icon: Radar },
  { label: "Profile", href: `${S}/profile`, icon: UserRound, section: "ACCOUNT" },
];

const CONFIG: ConsoleConfig = {
  role: "admin",
  base: S,
  loginHref: "/staff_admin/login",
  badge: "STAFF ADMIN",
  roleLabel: "STAFF ADMIN",
  consoleName: "Staff Admin Console",
  headerSubtitle: "BhansaMart Store Operations",
  menu: MENU,
  useSession: useStaffAdminSession,
  clearSession: clearStaffAdminSession,
};

/** Staff Admin console shell — mounted once by app/staff_admin/dashboard/layout.tsx */
export default function StaffAdminLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell cfg={CONFIG}>{children}</ConsoleShell>;
}
