"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Boxes,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorReportsPage() {
  const { stats, vendorProfile, vendorUser } = useAppSelector(
    (state) => state.vendor
  );
  const [reportType, setReportType] = useState<"sales" | "orders" | "tax">("sales");
  const [dateRange, setDateRange] = useState("This Month");
  const [generatedDate, setGeneratedDate] = useState("Today");

  useEffect(() => {
    setGeneratedDate(new Date().toLocaleDateString());
  }, []);

  const totalSales = stats?.totalSales ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const completed = stats?.completedOrders ?? 0;
  const cancelled = stats?.cancelledOrders ?? 0;

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Breadcrumb & Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/seller/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-500 font-medium">Business Intelligence</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Reports</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Reports & Performance Statement
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { id: "sales", label: "Sales & Revenue" },
              { id: "orders", label: "Order Fulfilment" },
              { id: "tax", label: "Tax & GST Invoice" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  reportType === tab.id
                    ? "bg-[#0C831F] text-white"
                    : "text-gray-500 hover:text-gray-900 bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-50 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 text-gray-700"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Last 90 Days</option>
            <option>Year to Date</option>
          </select>
        </div>

        {/* ── Report Document Preview Card ── */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md space-y-6">
          <div className="flex items-start justify-between border-b border-gray-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0C831F] text-white flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <span className="font-extrabold text-lg text-gray-900">
                  BhansaMart Merchant Report
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Store:{" "}
                <span className="font-bold text-gray-800">
                  {vendorProfile?.businessDetails?.businessName ||
                    vendorUser?.name ||
                    "Express Store"}
                </span>
              </p>
              <p className="text-[11px] text-gray-400">
                Period: {dateRange} • Generated: {generatedDate}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-green-50 text-[#0C831F] border border-green-200">
                Verified Statement
              </span>
            </div>
          </div>

          {/* Metric Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">
                Total Orders
              </span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                {totalOrders}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">
                Delivered
              </span>
              <span className="text-xl font-black text-[#0C831F] mt-1 block">
                {completed}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">
                Gross GMV
              </span>
              <span className="text-xl font-black text-gray-900 mt-1 block">
                ₹{totalSales.toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[11px] text-gray-400 font-bold uppercase block">
                Cancellations
              </span>
              <span className="text-xl font-black text-red-600 mt-1 block">
                {cancelled}
              </span>
            </div>
          </div>

          {/* Performance Summary Details */}
          <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
            <div className="flex justify-between py-1 text-gray-600">
              <span>Gross Sales (Product GMV)</span>
              <span className="font-bold text-gray-900">₹{totalSales}</span>
            </div>
            <div className="flex justify-between py-1 text-gray-600">
              <span>Delivery & Platform Commissions</span>
              <span className="font-bold text-red-600">
                -₹{Math.max(0, totalSales - (stats?.totalEarned ?? 0))}
              </span>
            </div>
            <div className="flex justify-between py-1 text-gray-600">
              <span>Refunds & Cancelled Reversals</span>
              <span className="font-bold text-gray-700">₹0</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-200 text-sm font-black text-gray-900">
              <span>Net Merchant Disbursable Amount</span>
              <span className="text-[#0C831F]">
                ₹{(stats?.totalEarned ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
