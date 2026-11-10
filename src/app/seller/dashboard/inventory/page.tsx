"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  FileText,
  DollarSign,
  X,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorProducts,
  toggleProductStock,
  VendorProduct,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

interface SupplierItem {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  itemSupplied: string;
  leadTime: string;
}

interface PurchaseItem {
  id: string;
  purchaseId: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  totalPaid: number;
  balance: number;
  status: "Delivered" | "Pending";
}

const DEFAULT_SUPPLIERS: SupplierItem[] = [
  {
    id: "s1",
    name: "Fresh Farm Produce Co.",
    contactPerson: "Rajiv Koirala",
    phone: "+977-9801234567",
    itemSupplied: "Fruits, Vegetables & Greens",
    leadTime: "1-2 Days",
  },
  {
    id: "s2",
    name: "Himalayan Dairy Distributors",
    contactPerson: "Bikram Thapa",
    phone: "+977-9812345678",
    itemSupplied: "Milk, Butter, Paneer, Curd",
    leadTime: "Daily (6 AM)",
  },
  {
    id: "s3",
    name: "Metro FMCG Wholesalers",
    contactPerson: "Sunil Shrestha",
    phone: "+977-9823456789",
    itemSupplied: "Snacks, Biscuits, Beverages",
    leadTime: "2-3 Days",
  },
  {
    id: "s4",
    name: "Annapurna Grains & Pulses",
    contactPerson: "Mohan Agrawal",
    phone: "+977-9834567890",
    itemSupplied: "Atta, Basmati Rice, Dals",
    leadTime: "3 Days",
  },
];

const DEFAULT_PURCHASES: PurchaseItem[] = [
  {
    id: "p1",
    purchaseId: "#PO-2026-081",
    supplierName: "Fresh Farm Produce Co.",
    date: "2026-11-08",
    totalAmount: 18500,
    totalPaid: 18500,
    balance: 0,
    status: "Delivered",
  },
  {
    id: "p2",
    purchaseId: "#PO-2026-079",
    supplierName: "Himalayan Dairy Distributors",
    date: "2026-11-09",
    totalAmount: 9400,
    totalPaid: 9400,
    balance: 0,
    status: "Delivered",
  },
  {
    id: "p3",
    purchaseId: "#PO-2026-075",
    supplierName: "Metro FMCG Wholesalers",
    date: "2026-11-05",
    totalAmount: 32000,
    totalPaid: 25000,
    balance: 7000,
    status: "Pending",
  },
];

function VendorInventoryContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";

  const dispatch = useAppDispatch();
  const { products, productsLoading } = useAppSelector((state) => state.vendor);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(DEFAULT_SUPPLIERS);
  const [purchases, setPurchases] = useState<PurchaseItem[]>(DEFAULT_PURCHASES);

  // Quick edit stock modal
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [newStockQty, setNewStockQty] = useState("");

  useEffect(() => {
    dispatch(fetchVendorProducts({}));
  }, [dispatch]);

  const handleUpdateStock = async () => {
    if (!editingProduct) return;
    const qty = parseInt(newStockQty, 10);
    if (isNaN(qty) || qty < 0) return;

    try {
      const token = localStorage.getItem("bhansa_vendor_token");
      await fetch(`/api/products/${editingProduct._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock: qty, inStock: qty > 0 }),
      });
      dispatch(fetchVendorProducts({}));
      setEditingProduct(null);
    } catch (e) {
      console.error(e);
    }
  };

  const getProductImage = (prod: VendorProduct) => {
    if (prod.images && prod.images.length > 0) {
      const first = prod.images[0];
      return typeof first === "string" ? first : first.url;
    }
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80";
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="text-gray-500 font-medium">Inventory Management</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">
                {activeTab === "overview"
                  ? "Stock Overview"
                  : activeTab === "suppliers"
                  ? "Supplier List"
                  : "Purchase History"}
              </span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Inventory & Supply Chain
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export Statement
            </button>
          </div>
        </div>

        {/* ── Tabs (Matching Figma Inventory Screens) ── */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "overview", label: "Stock Overview" },
            { id: "suppliers", label: "Supplier List" },
            { id: "purchases", label: "Purchase History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#0C831F] text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Search Toolbar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items, suppliers, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ── TAB 1: Stock Overview (Matching Screen 1 in Figma) ── */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">Stock Qty</th>
                    <th className="px-5 py-3.5">Reorder Point</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.stock <= (prod.reorderLevel ?? 5) && prod.stock > 0;
                    const isOut = prod.stock === 0 || !prod.inStock;

                    return (
                      <tr key={prod._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={getProductImage(prod)}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">
                                {prod.name}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {prod.category}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-600">
                          {prod.supplierName || "Fresh Farms Dist."}
                        </td>
                        <td className="px-5 py-3.5 font-black text-gray-900 text-sm">
                          {prod.stock}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 font-semibold">
                          {prod.reorderLevel ?? 5}
                        </td>
                        <td className="px-5 py-3.5">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3" /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setNewStockQty(String(prod.stock));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Adjust Qty
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 2: Supplier List (Matching Screen 2 in Figma) ── */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Supplier Name</th>
                    <th className="px-5 py-3.5">Contact Person</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Items Supplied</th>
                    <th className="px-5 py-3.5">Lead Time</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {suppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {sup.name}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{sup.contactPerson}</td>
                      <td className="px-5 py-3.5 text-gray-500">{sup.phone}</td>
                      <td className="px-5 py-3.5 text-gray-700">{sup.itemSupplied}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#0C831F]">
                        {sup.leadTime}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="text-xs font-bold text-[#0C831F] hover:underline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: Purchase History (Matching Screen 3 in Figma) ── */}
        {activeTab === "purchases" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Purchase ID</th>
                    <th className="px-5 py-3.5">Supplier Name</th>
                    <th className="px-5 py-3.5">Purchase Date</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Total Paid</th>
                    <th className="px-5 py-3.5">Balance</th>
                    <th className="px-5 py-3.5">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {po.purchaseId}
                      </td>
                      <td className="px-5 py-3.5 font-medium">{po.supplierName}</td>
                      <td className="px-5 py-3.5 text-gray-500">{po.date}</td>
                      <td className="px-5 py-3.5 font-black text-gray-900">
                        ₹{po.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-green-700 font-bold">
                        ₹{po.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-red-600 font-bold">
                        ₹{po.balance.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            po.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Adjust Qty Modal ── */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-scaleUp">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-900">
                  Adjust Inventory Stock
                </h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4">
                <p className="text-xs font-bold text-gray-900 line-clamp-1">
                  {editingProduct.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Current Available Stock: {editingProduct.stock}
                </p>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStockQty}
                    onChange={(e) => setNewStockQty(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-sm font-bold px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStock}
                  className="flex-1 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs"
                >
                  Save Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export default function VendorInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">Loading inventory...</div>
      }
    >
      <VendorInventoryContent />
    </Suspense>
  );
}
