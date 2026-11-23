"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Truck,
  Boxes,
  Tags,
  Users,
  PieChart,
  FileBarChart,
  Bell,
  HardDrive,
  ChevronDown,
  LogOut,
  X,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useVendor } from "@/lib/seller/useVendor";
import { logoutVendor } from "@/redux/slices/vendorSlice";
import { disconnectVendorSocket } from "@/lib/seller/socket";
import { clearStorageState } from "@/lib/seller/storage";
import { SidebarStorageMeter } from "./StorageWidgets";

interface SubItem {
  title: string;
  href: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  subItems?: SubItem[];
}

const D = "/seller/dashboard";

/** The app's vendor side menu (components/VendorComponent/vendorSideMenu.tsx), minus entries that duplicated another link */
const buildMenu = (pendingOrders: number, unread: number): MenuItem[] => [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, href: D },
  {
    id: "orders",
    title: "Order Management",
    icon: ShoppingCart,
    href: `${D}/orders`,
    badge: pendingOrders,
    subItems: [
      { title: "All Orders", href: `${D}/orders` },
      { title: "Pending Orders", href: `${D}/orders?status=pending` },
      { title: "Completed Orders", href: `${D}/orders?status=completed` },
    ],
  },
  {
    id: "products",
    title: "Product Management",
    icon: Package,
    href: `${D}/products`,
    subItems: [
      { title: "Product List", href: `${D}/products` },
      { title: "Add New Product", href: `${D}/products/add` },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & Wallet",
    icon: Wallet,
    href: `${D}/transactions`,
    subItems: [
      { title: "Transaction History", href: `${D}/transactions` },
      { title: "COD Cash Handover", href: `${D}/cod-handover` },
      { title: "Payment QR & UPI", href: `${D}/payment-qr` },
    ],
  },
  { id: "notifications", title: "Notifications", icon: Bell, href: `${D}/notifications`, badge: unread },
  {
    id: "delivery",
    title: "Delivery Management",
    icon: Truck,
    href: `${D}/delivery`,
    subItems: [
      { title: "Active Dispatches", href: `${D}/delivery` },
      { title: "Delivery History", href: `${D}/delivery?tab=delivered` },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Management",
    icon: Boxes,
    href: `${D}/inventory`,
    subItems: [
      { title: "Stock Overview", href: `${D}/inventory` },
      { title: "Low Stock Alerts", href: `${D}/inventory?filter=low_stock` },
    ],
  },
  {
    id: "attributes",
    title: "Brands & Attributes",
    icon: Tags,
    href: `${D}/attributes`,
    subItems: [
      { title: "Brands", href: `${D}/attributes?tab=brands` },
      { title: "Attributes", href: `${D}/attributes?tab=attributes` },
      { title: "Brand Requests", href: `${D}/attributes?tab=requests` },
    ],
  },
  { id: "storage", title: "Storage & Recharge", icon: HardDrive, href: `${D}/storage` },
  { id: "customers", title: "Customer", icon: Users, href: `${D}/customers` },
  {
    id: "finance",
    title: "Finance & Expense",
    icon: PieChart,
    href: `${D}/finance`,
    subItems: [
      { title: "Finance Overview", href: `${D}/finance` },
      { title: "Withdrawal Requests", href: `${D}/finance?tab=withdrawals` },
      { title: "Settled Orders", href: `${D}/finance?tab=settlements` },
      { title: "Delivery Boy Cash", href: `${D}/finance?tab=delivery` },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: FileBarChart,
    href: `${D}/reports`,
    subItems: [
      { title: "Monthly Sales Report", href: `${D}/reports` },
      { title: "Deliveries & Returns", href: `${D}/reports?tab=delivery` },
      { title: "Growth & Revenue", href: `${D}/reports?tab=growth` },
    ],
  },
];

const splitHref = (href: string) => {
  const [path, qs = ""] = href.split("?");
  return { path, params: new URLSearchParams(qs) };
};

interface VendorSidebarProps {
  collapsed: boolean;
  /** Mobile drawer state */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function VendorSidebar(props: VendorSidebarProps) {
  return (
    <React.Suspense fallback={<SidebarFrame {...props} pathname="" query={new URLSearchParams()} />}>
      <SidebarWithRoute {...props} />
    </React.Suspense>
  );
}

function SidebarWithRoute(props: VendorSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <SidebarFrame {...props} pathname={pathname} query={new URLSearchParams(searchParams.toString())} />;
}

function SidebarFrame({
  collapsed,
  mobileOpen,
  onCloseMobile,
  pathname,
  query,
}: VendorSidebarProps & { pathname: string; query: URLSearchParams }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const vendorState = useVendor();
  const handleLogout = () => {
    disconnectVendorSocket();
    clearStorageState();
    dispatch(logoutVendor());
    router.replace("/seller");
  };
  const menu = buildMenu(vendorState?.pendingCount ?? 0, vendorState?.unreadNotificationsCount ?? 0);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // A sub-link is active when its path matches and every query param it sets matches
  const isSubActive = (href: string) => {
    const { path, params } = splitHref(href);
    if (path !== pathname) return false;
    const keys = Array.from(params.keys());
    if (keys.length === 0) {
      // plain link is active only when no tab/filter/status param is selected
      return !["tab", "status", "filter"].some((k) => query.get(k));
    }
    return keys.every((k) => query.get(k) === params.get(k));
  };

  const isGroupActive = (item: MenuItem) => {
    return (
      pathname === item.href ||
      (item.id !== "dashboard" && pathname.startsWith(`${item.href}/`)) ||
      Boolean(item.subItems?.some((s) => splitHref(s.href).path === pathname))
    );
  };

  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`bg-white border-r border-slate-100 flex flex-col z-50 h-screen select-none transition-all duration-300
          fixed inset-y-0 left-0 w-72 max-w-[85vw] lg:max-w-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:translate-x-0 ${collapsed ? "lg:w-20" : "lg:w-64"}`}
        aria-label="Seller navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <Link href={D} className="flex items-center overflow-hidden" onClick={onCloseMobile}>
            {showLabels ? (
              <div className="flex flex-col">
                <div className="relative w-[136px] h-[40px] overflow-hidden">
                  <Image src="/images/seller/vendor-banner-logo.png" alt="BhansaMart" fill sizes="136px" className="object-cover" priority />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-vendor -mt-0.5 pl-1">Seller Hub</span>
              </div>
            ) : (
              <div className="relative w-10 h-10 rounded-xl bg-white border border-vendor-100 overflow-hidden shrink-0">
                <Image src="/images/seller/vendor-cart-badge.png" alt="BhansaMart" fill sizes="40px" className="object-cover scale-[1.45]" priority />
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isGroupActive(item);
            const open = openGroups[item.id] ?? active;
            const badge = item.badge && item.badge > 0 ? (item.badge > 99 ? "99+" : String(item.badge)) : null;

            const rowCls = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              active ? "bg-vendor-soft text-vendor-dark font-semibold" : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
            }`;
            const iconEl = (
              <span className="relative shrink-0">
                <Icon className={`w-5 h-5 ${active ? "text-vendor" : "text-slate-500"}`} />
                {badge && !showLabels && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </span>
            );
            const badgeEl = badge && showLabels && (
              <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {badge}
              </span>
            );

            if (!item.subItems || !showLabels) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={rowCls}
                  title={!showLabels ? item.title : undefined}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {iconEl}
                  {showLabels && <span className="truncate">{item.title}</span>}
                  {badgeEl}
                </Link>
              );
            }

            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenGroups((g) => ({ ...g, [item.id]: !open }))}
                  className={`${rowCls} cursor-pointer`}
                  aria-expanded={open}
                >
                  {iconEl}
                  <span className="truncate">{item.title}</span>
                  {badgeEl}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${badge ? "" : "ml-auto"} ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="ml-6 pl-3 border-l border-slate-200 my-1 space-y-0.5">
                    {item.subItems.map((sub) => {
                      const subActive = isSubActive(sub.href);
                      return (
                        <Link
                          key={sub.href + sub.title}
                          href={sub.href}
                          onClick={onCloseMobile}
                          aria-current={subActive ? "page" : undefined}
                          className={`block px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                            subActive
                              ? "text-vendor-dark font-semibold bg-vendor-soft"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {sub.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout — app side menu footer */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <SidebarStorageMeter showLabels={showLabels} onNavigate={onCloseMobile} />
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer ${showLabels ? "" : "justify-center"}`}
            title={!showLabels ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {showLabels && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
