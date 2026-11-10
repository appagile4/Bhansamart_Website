"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  CircleDollarSign,
  Truck,
  Boxes,
  Sliders,
  Users,
  PieChart,
  Gift,
  FileSpreadsheet,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Store,
  ExternalLink,
  Power,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateStoreStatus } from "@/redux/slices/vendorSlice";

interface SubItem {
  id: string;
  title: string;
  href: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  href?: string;
  hasDropdown?: boolean;
  subItems?: SubItem[];
}

export default function VendorSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const isStoreOpen = vendorState?.isStoreOpen ?? true;
  const vendorProfile = vendorState?.vendorProfile ?? null;
  const vendorUser = vendorState?.vendorUser ?? null;

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    orders: pathname.includes("/orders"),
    products: pathname.includes("/products"),
    inventory: pathname.includes("/inventory"),
  });

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/seller/dashboard",
    },
    {
      id: "orders",
      title: "Order Management",
      icon: <ShoppingCart className="w-5 h-5" />,
      hasDropdown: true,
      subItems: [
        { id: "all_orders", title: "Orders List", href: "/seller/dashboard/orders" },
        { id: "new_orders", title: "New Orders", href: "/seller/dashboard/orders?tab=pending" },
        { id: "preparing_orders", title: "Preparing", href: "/seller/dashboard/orders?tab=preparing" },
        { id: "completed_orders", title: "Completed Orders", href: "/seller/dashboard/orders?tab=completed" },
        { id: "cancelled_orders", title: "Cancelled Orders", href: "/seller/dashboard/orders?tab=cancelled" },
      ],
    },
    {
      id: "products",
      title: "Product Management",
      icon: <Package className="w-5 h-5" />,
      hasDropdown: true,
      subItems: [
        { id: "product_list", title: "Product List", href: "/seller/dashboard/products" },
        { id: "add_product", title: "Add Product", href: "/seller/dashboard/products/add" },
        { id: "category_list", title: "Category List", href: "/seller/dashboard/products/categories" },
      ],
    },
    {
      id: "transactions",
      title: "Transaction & Wallet",
      icon: <CircleDollarSign className="w-5 h-5" />,
      href: "/seller/dashboard/transactions",
    },
    {
      id: "delivery",
      title: "Delivery Management",
      icon: <Truck className="w-5 h-5" />,
      href: "/seller/dashboard/delivery",
    },
    {
      id: "inventory",
      title: "Inventory Management",
      icon: <Boxes className="w-5 h-5" />,
      hasDropdown: true,
      subItems: [
        { id: "stock_overview", title: "Stock Overview", href: "/seller/dashboard/inventory" },
        { id: "suppliers", title: "Supplier List", href: "/seller/dashboard/inventory?tab=suppliers" },
        { id: "purchase_history", title: "Purchase History", href: "/seller/dashboard/inventory?tab=purchases" },
      ],
    },
    {
      id: "attributes",
      title: "Attribute & Brands",
      icon: <Sliders className="w-5 h-5" />,
      href: "/seller/dashboard/attributes",
    },
    {
      id: "customers",
      title: "Customer",
      icon: <Users className="w-5 h-5" />,
      href: "/seller/dashboard/customers",
    },
    {
      id: "finance",
      title: "Finance & Expense",
      icon: <PieChart className="w-5 h-5" />,
      href: "/seller/dashboard/finance",
    },
    {
      id: "rewards",
      title: "Referral & Rewards",
      icon: <Gift className="w-5 h-5" />,
      href: "/seller/dashboard/rewards",
    },
    {
      id: "reports",
      title: "Reports",
      icon: <FileSpreadsheet className="w-5 h-5" />,
      href: "/seller/dashboard/reports",
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      id: "notifications",
      title: "Notification",
      icon: <Bell className="w-5 h-5" />,
      href: "/seller/dashboard/notifications",
    },
    {
      id: "settings",
      title: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/seller/dashboard/settings",
    },
  ];

  const isItemActive = (item: MenuItem) => {
    if (item.href && pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some((s) => pathname === s.href.split("?")[0]);
    }
    return false;
  };

  const handleToggleStoreStatus = () => {
    dispatch(updateStoreStatus(!isStoreOpen));
  };

  return (
    <aside
      className={`bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      } min-h-screen sticky top-0 h-screen select-none`}
    >
      {/* ── Brand Logo & Header ── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Link href="/seller/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0C831F] to-[#25A53B] flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">
            B
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-tight">
                Bhansa<span className="text-[#0C831F]">Mart</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Seller Hub
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── Navigation Links Scrollable ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
        {/* Main Section */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Main Menu
            </p>
          )}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = isItemActive(item);
              const isOpen = openDropdowns[item.id];

              if (item.hasDropdown) {
                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-green-50 text-[#0C831F]"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      title={collapsed ? item.title : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? "text-[#0C831F]" : "text-gray-500"}>
                          {item.icon}
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                      {!collapsed && (
                        <span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </span>
                      )}
                    </button>

                    {/* Sub-items */}
                    {!collapsed && isOpen && item.subItems && (
                      <div className="ml-8 pl-2 border-l border-gray-100 space-y-1 py-1">
                        {item.subItems.map((sub) => {
                          const isSubActive =
                            pathname === sub.href.split("?")[0];
                          return (
                            <Link
                              key={sub.id}
                              href={sub.href}
                              className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSubActive
                                  ? "text-[#0C831F] font-semibold bg-green-50/60"
                                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
              }

              return (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#0C831F] text-white shadow-sm font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={active ? "text-white" : "text-gray-500"}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings Group */}
        <div>
          {!collapsed && (
            <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Settings & Info
            </p>
          )}
          <nav className="space-y-1">
            {settingsItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href || "#"}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[#0C831F] text-white shadow-sm font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  title={collapsed ? item.title : undefined}
                >
                  <span className={active ? "text-white" : "text-gray-500"}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Footer / Store Status Toggle ── */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        {!collapsed ? (
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStoreOpen ? "bg-[#0C831F] animate-pulse" : "bg-red-500"
                }`}
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-800">
                  {isStoreOpen ? "Store Active" : "Store Closed"}
                </span>
                <span className="text-[10px] text-gray-500">
                  {isStoreOpen ? "Receiving orders" : "Offline"}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleStoreStatus}
              className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isStoreOpen
                  ? "bg-green-50 text-[#0C831F] border-green-200 hover:bg-green-100"
                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              }`}
              title={isStoreOpen ? "Click to pause store" : "Click to open store"}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggleStoreStatus}
            className={`w-full py-2.5 flex items-center justify-center rounded-xl border ${
              isStoreOpen
                ? "bg-green-50 text-[#0C831F] border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
            title={isStoreOpen ? "Store is Open" : "Store is Closed"}
          >
            <Power className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
