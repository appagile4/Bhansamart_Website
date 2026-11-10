"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import VendorLayout from "@/components/vendor/VendorLayout";

interface BrandRequest {
  _id: string;
  brandName: string;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export default function VendorAttributesPage() {
  const [brandRequests, setBrandRequests] = useState<BrandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("Grocery");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadBrands() {
      try {
        const token = localStorage.getItem("bhansa_vendor_token");
        const res = await fetch("/api/vendor/brand-requests", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data && data.brandRequests) {
          setBrandRequests(data.brandRequests);
        } else {
          // Provide default sample approved brand list
          setBrandRequests([
            {
              _id: "br_1",
              brandName: "Amul",
              category: "Dairy, Bread & Eggs",
              status: "APPROVED",
              createdAt: new Date().toISOString(),
            },
            {
              _id: "br_2",
              brandName: "Nestle",
              category: "Packaged Foods",
              status: "APPROVED",
              createdAt: new Date().toISOString(),
            },
            {
              _id: "br_3",
              brandName: "Farm Fresh Organics",
              category: "Fruits & Vegetables",
              status: "APPROVED",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBrands();
  }, []);

  const handleRequestBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setSubmitting(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("bhansa_vendor_token");
      const res = await fetch("/api/vendor/brand-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brandName: newBrandName.trim(),
          category: newBrandCategory,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Brand authorization request submitted for review!");
        setBrandRequests([
          {
            _id: `br_${Date.now()}`,
            brandName: newBrandName.trim(),
            category: newBrandCategory,
            status: "PENDING",
            createdAt: new Date().toISOString(),
          },
          ...brandRequests,
        ]);
        setTimeout(() => setShowRequestModal(false), 1500);
      } else {
        setMsg(data.message || "Failed to submit brand request.");
      }
    } catch {
      setMsg("Network error submitting brand request.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <span className="text-gray-500 font-medium">Catalog Settings</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Brands & Attributes</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Brands & Attribute Authorizations
            </h1>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Request Brand Approval
          </button>
        </div>

        {/* ── Brand Requests Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Authorized Brands Catalog
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Brands you have permission to publish and sell through BhansaMart.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Brand Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Approval Status</th>
                  <th className="px-5 py-3.5 text-right">Requested Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {brandRequests.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-gray-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-[#0C831F] flex items-center justify-center font-bold">
                        {b.brandName[0]}
                      </div>
                      {b.brandName}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-600">
                      {b.category}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          b.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : b.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status === "APPROVED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Request Modal ── */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  Request Brand Approval
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {msg && (
                <div className="my-3 p-3 rounded-xl bg-green-50 text-green-700 text-xs font-semibold">
                  {msg}
                </div>
              )}

              <form onSubmit={handleRequestBrand} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Britannia, Kellogg's, Coca-Cola"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Primary Category
                  </label>
                  <select
                    value={newBrandCategory}
                    onChange={(e) => setNewBrandCategory(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  >
                    <option value="Dairy, Bread & Eggs">Dairy, Bread & Eggs</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Snacks & Munchies">Snacks & Munchies</option>
                    <option value="Cold Drinks & Juices">Cold Drinks & Juices</option>
                    <option value="Packaged Foods">Packaged Foods</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Submit for Approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
