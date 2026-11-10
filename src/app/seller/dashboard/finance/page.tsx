"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  PieChart,
  TrendingUp,
  CircleDollarSign,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorStats,
  fetchVendorTransactions,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorFinancePage() {
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const stats = vendorState?.stats ?? null;
  const transactions = vendorState?.transactions ?? [];

  useEffect(() => {
    dispatch(fetchVendorStats());
    dispatch(fetchVendorTransactions());
  }, [dispatch]);

  const totalSales = stats?.totalSales ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;
  const commissionPaid = Math.max(0, totalSales - totalEarned);
  const pendingSettlement = stats?.pendingSettlement ?? 0;

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* ── Breadcrumb & Top Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/seller/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-500 font-medium">Accounting</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Finance & Expense</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Financial Breakdown & Earnings
            </h1>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Download P&L Statement
          </button>
        </div>

        {/* ── 4 Finance Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Gross Merchandise Value (GMV)
            </span>
            <p className="text-2xl font-black text-gray-900 mt-2">
              ₹{totalSales.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Total customer order value</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Net Merchant Earnings
            </span>
            <p className="text-2xl font-black text-[#0C831F] mt-2">
              ₹{totalEarned.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Credited to vendor wallet</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Platform & Tech Fee
            </span>
            <p className="text-2xl font-black text-gray-700 mt-2">
              ₹{commissionPaid.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Transparent 5-10% slab</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Pending Clearing
            </span>
            <p className="text-2xl font-black text-purple-600 mt-2">
              ₹{pendingSettlement.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">Clearing on delivery</p>
          </div>
        </div>

        {/* ── Deductions & Settlement Ledger ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Settlement Ledger & Commission Breakdown
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Itemized statement of all order disbursements and deductions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Reference ID</th>
                  <th className="px-5 py-3.5">Transaction Type</th>
                  <th className="px-5 py-3.5">Gross Order Value</th>
                  <th className="px-5 py-3.5">Platform Commission</th>
                  <th className="px-5 py-3.5">Net Payout</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      No settled transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {tx._id.slice(-8)}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{tx.type}</td>
                      <td className="px-5 py-3.5">₹{tx.grossAmount || tx.amount}</td>
                      <td className="px-5 py-3.5 text-red-600 font-semibold">
                        -₹{tx.commission || 0}
                      </td>
                      <td className="px-5 py-3.5 font-black text-gray-900">
                        ₹{tx.netAmount || tx.amount}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#0C831F]">
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
