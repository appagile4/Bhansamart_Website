"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  ShoppingCart,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchVendorCustomers } from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorCustomersPage() {
  const dispatch = useAppDispatch();
  const { customers, customersLoading } = useAppSelector((state) => state.vendor);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(fetchVendorCustomers());
  }, [dispatch]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="text-gray-500 font-medium">Customer Relations</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Customer List</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Store Customers
            </h1>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Export Directory
          </button>
        </div>

        {/* ── Search Toolbar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {filtered.length} customer(s)
          </span>
        </div>

        {/* ── Customers Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Orders Placed</th>
                  <th className="px-5 py-3.5">Total Spent</th>
                  <th className="px-5 py-3.5">Delivered</th>
                  <th className="px-5 py-3.5 text-right">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customersLoading && customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      Loading customer directory...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 text-white font-bold flex items-center justify-center shrink-0">
                            {c.name ? c.name[0].toUpperCase() : "C"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.name}</p>
                            <span className="text-[10px] text-gray-400">
                              ID: {c.customerId || c._id.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 space-y-0.5">
                        <p className="text-gray-900 font-medium flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {c.phone || "N/A"}
                        </p>
                        <p className="text-gray-400 text-[11px] flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {c.email || "N/A"}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {c.orderCount} order(s)
                      </td>
                      <td className="px-5 py-3.5 font-black text-gray-900">
                        ₹{c.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-[#0C831F]">
                          {c.deliveredCount} delivered
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-400">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString()
                          : "Recently"}
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
