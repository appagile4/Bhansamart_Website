"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Boxes,
  Star,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorStats,
  fetchVendorOrders,
  fetchVendorProducts,
  updateVendorOrderStatus,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorDashboardOverview() {
  const dispatch = useAppDispatch();
  const {
    stats,
    statsLoading,
    orders,
    ordersLoading,
    products,
    vendorUser,
    vendorProfile,
    isStoreOpen,
  } = useAppSelector((state) => state.vendor);

  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    dispatch(fetchVendorStats());
    dispatch(fetchVendorOrders({ limit: 10 }));
    dispatch(fetchVendorProducts({ limit: 5 }));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchVendorStats());
    dispatch(fetchVendorOrders({ limit: 10 }));
  };

  const handleQuickStatusUpdate = async (orderId: string, nextStatus: string) => {
    await dispatch(updateVendorOrderStatus({ orderId, status: nextStatus }));
    dispatch(fetchVendorStats());
  };

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  const totalSales = stats?.totalSales ?? 0;
  const availableBal = stats?.availableWithdrawalBalance ?? 0;
  const pendingOrders = stats?.pendingOrders ?? 0;
  const completedOrders = stats?.completedOrders ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const storeRating = stats?.storeRating ?? 4.8;

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* ── Top Welcome & Action Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Welcome back, {vendorUser?.name || "Vendor"}!
              <span className="text-xl">👋</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Store:{" "}
              <span className="font-semibold text-gray-800">
                {vendorProfile?.businessDetails?.businessName ||
                  vendorProfile?.storeName ||
                  "BhansaMart Express Hub"}
              </span>{" "}
              • Status:{" "}
              <span
                className={`font-bold ${
                  isStoreOpen ? "text-[#0C831F]" : "text-red-500"
                }`}
              >
                {isStoreOpen ? "Open & Delivering" : "Temporarily Closed"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw
                className={`w-4 h-4 ${statsLoading ? "animate-spin text-[#0C831F]" : ""}`}
              />
            </button>

            <Link
              href="/seller/dashboard/products/add"
              className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* ── 4 Main Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0C831F] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900">
                ₹{totalSales.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-[#0C831F] font-bold flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.5%
              </span>
              <span>vs previous month</span>
            </div>
          </div>

          {/* 2. Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-gray-900">
                {totalOrders}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-[#0C831F] font-bold">{completedOrders}</span>
              <span>Delivered successfully</span>
            </div>
          </div>

          {/* 3. Available Balance */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Wallet Balance
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-black text-gray-900">
                ₹{availableBal.toLocaleString()}
              </span>
              <Link
                href="/seller/dashboard/transactions"
                className="text-[11px] font-bold text-[#0C831F] hover:underline"
              >
                Withdraw
              </Link>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Pending payout: ₹{(stats?.pendingSettlement ?? 0).toLocaleString()}
            </div>
          </div>

          {/* 4. Store Rating */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Customer Rating
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-black text-gray-900">
                {storeRating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400 font-medium">/ 5.0</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Based on verified customer reviews
            </div>
          </div>
        </div>

        {/* ── Order Status Flow Pills ── */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Order Pipeline Overview
            </h2>
            <Link
              href="/seller/dashboard/orders"
              className="text-xs font-bold text-[#0C831F] hover:underline flex items-center gap-1"
            >
              View All Orders <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* New / Pending */}
            <Link
              href="/seller/dashboard/orders?tab=pending"
              className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex items-center justify-between text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-lg font-black">{pendingOrders}</span>
              </div>
              <p className="text-xs font-bold text-amber-900 mt-2">New Orders</p>
              <p className="text-[10px] text-amber-700">Requires acceptance</p>
            </Link>

            {/* Preparing */}
            <Link
              href="/seller/dashboard/orders?tab=preparing"
              className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/60 hover:bg-blue-100/60 transition-colors"
            >
              <div className="flex items-center justify-between text-blue-800">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span className="text-lg font-black">{stats?.processingOrders ?? 0}</span>
              </div>
              <p className="text-xs font-bold text-blue-900 mt-2">Preparing</p>
              <p className="text-[10px] text-blue-700">Packing items</p>
            </Link>

            {/* Ready for Pickup */}
            <Link
              href="/seller/dashboard/orders?tab=ready"
              className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/60 hover:bg-purple-100/60 transition-colors"
            >
              <div className="flex items-center justify-between text-purple-800">
                <Truck className="w-4 h-4 text-purple-600" />
                <span className="text-lg font-black">
                  {orders.filter((o) => o.orderStatus === "READY_FOR_PICKUP").length}
                </span>
              </div>
              <p className="text-xs font-bold text-purple-900 mt-2">Ready / Dispatch</p>
              <p className="text-[10px] text-purple-700">Waiting rider pickup</p>
            </Link>

            {/* Completed */}
            <Link
              href="/seller/dashboard/orders?tab=completed"
              className="p-3.5 rounded-xl bg-green-50/70 border border-green-200/60 hover:bg-green-100/60 transition-colors"
            >
              <div className="flex items-center justify-between text-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-lg font-black">{completedOrders}</span>
              </div>
              <p className="text-xs font-bold text-green-900 mt-2">Completed</p>
              <p className="text-[10px] text-green-700">Delivered to door</p>
            </Link>

            {/* Cancelled */}
            <Link
              href="/seller/dashboard/orders?tab=cancelled"
              className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between text-gray-700">
                <XCircle className="w-4 h-4 text-gray-500" />
                <span className="text-lg font-black">{stats?.cancelledOrders ?? 0}</span>
              </div>
              <p className="text-xs font-bold text-gray-800 mt-2">Cancelled</p>
              <p className="text-[10px] text-gray-500">Refunded / Rejected</p>
            </Link>
          </div>
        </div>

        {/* ── Recent Live Orders Table (Matching Figma Orders Screen) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">
                Incoming & Live Orders
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Orders requiring verification and store preparation
              </p>
            </div>
            <Link
              href="/seller/dashboard/orders"
              className="text-xs font-bold text-[#0C831F] hover:underline flex items-center gap-1"
            >
              See All Orders <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created At</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {ordersLoading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                      Loading live orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center">
                      <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-600">No active orders right now</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        New orders will appear here automatically in real time.
                      </p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const status = order.orderStatus || "PLACED";
                    return (
                      <tr key={order._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {order.orderNumber || order._id.slice(-8)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900">
                            {order.user?.name || "Customer"}
                          </p>
                          <p className="text-gray-400 text-[11px]">
                            {order.deliveryAddress?.city || "Local"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 font-medium">
                          {order.items?.length || 0} item(s)
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          ₹{order.totalAmount}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              status === "PLACED"
                                ? "bg-amber-100 text-amber-800"
                                : status === "ACCEPTED" || status === "PREPARING"
                                ? "bg-blue-100 text-blue-800"
                                : status === "READY_FOR_PICKUP"
                                ? "bg-purple-100 text-purple-800"
                                : status === "DELIVERED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          {status === "PLACED" && (
                            <button
                              onClick={() => handleQuickStatusUpdate(order._id, "ACCEPTED")}
                              className="px-2.5 py-1 rounded-lg bg-[#0C831F] hover:bg-[#0A701A] text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              Accept
                            </button>
                          )}
                          {status === "ACCEPTED" && (
                            <button
                              onClick={() => handleQuickStatusUpdate(order._id, "PREPARING")}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Prepare
                            </button>
                          )}
                          {status === "PREPARING" && (
                            <button
                              onClick={() =>
                                handleQuickStatusUpdate(order._id, "READY_FOR_PICKUP")
                              }
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Ready
                            </button>
                          )}
                          <Link
                            href={`/seller/dashboard/orders?verify=${order._id}`}
                            className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-[11px] font-semibold transition-colors inline-block"
                          >
                            Verify
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
