"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorProducts,
  toggleProductStock,
  deleteVendorProduct,
  VendorProduct,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorProductsPage() {
  const dispatch = useAppDispatch();
  const vendorState = useAppSelector((state) => state?.vendor);
  const products = vendorState?.products ?? [];
  const productsTotal = vendorState?.productsTotal ?? 0;
  const productsLoading = vendorState?.productsLoading ?? false;

  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(
      fetchVendorProducts({
        search: searchQuery,
        category: categoryFilter,
        stockStatus: stockStatusFilter,
        sortBy,
        page,
        limit,
      })
    );
  }, [dispatch, searchQuery, categoryFilter, stockStatusFilter, sortBy, page, limit]);

  const handleToggleStock = (productId: string) => {
    dispatch(toggleProductStock(productId));
  };

  const handleDeleteProduct = async (productId: string) => {
    await dispatch(deleteVendorProduct(productId));
    setDeleteConfirmId(null);
  };

  const getProductImage = (prod: VendorProduct) => {
    if (prod.images && prod.images.length > 0) {
      const first = prod.images[0];
      return typeof first === "string" ? first : first.url;
    }
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80";
  };

  const totalPages = Math.ceil(productsTotal / limit) || 1;

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
              <span className="text-gray-500 font-medium">Product Management</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Product List</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Product List
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title="Grid / Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/seller/dashboard/products/add"
              className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, SKU, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-50 text-xs font-medium text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Dairy, Bread & Eggs">Dairy, Bread & Eggs</option>
              <option value="Fruits & Vegetables">Fruits & Vegetables</option>
              <option value="Snacks & Munchies">Snacks & Munchies</option>
              <option value="Cold Drinks & Juices">Cold Drinks & Juices</option>
              <option value="Bakery & Biscuits">Bakery & Biscuits</option>
              <option value="Tea, Coffee & More">Tea, Coffee & More</option>
              <option value="Atta, Rice & Dal">Atta, Rice & Dal</option>
            </select>

            {/* Stock Status Filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className="bg-gray-50 text-xs font-medium text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 text-xs font-medium text-gray-700 px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
            >
              <option value="default">Sort By: Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="alpha">Alphabetical (A-Z)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>

        {/* ── Table View ── */}
        {viewMode === "table" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Sub Category</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">Stock</th>
                    <th className="px-5 py-3.5">Rating</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {productsLoading && products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0C831F]" />
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-600">No products found</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          Try adjusting your search or add a new product.
                        </p>
                        <Link
                          href="/seller/dashboard/products/add"
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add First Product
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    products.map((prod) => {
                      const isInStock = prod.inStock ?? prod.stock > 0;
                      return (
                        <tr key={prod._id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={getProductImage(prod)}
                                alt={prod.name}
                                className="w-12 h-12 rounded-xl object-cover border border-gray-100 bg-gray-50 shrink-0"
                              />
                              <div>
                                <Link
                                  href={`/seller/dashboard/products/${prod._id}`}
                                  className="font-bold text-gray-900 hover:text-[#0C831F] transition-colors line-clamp-1"
                                >
                                  {prod.name}
                                </Link>
                                <span className="text-[11px] text-gray-400">
                                  {prod.unit || "1 pack"} {prod.brand ? `• ${prod.brand}` : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-700">
                            {prod.category}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">
                            {prod.subCategory || "General"}
                          </td>
                          <td className="px-5 py-3.5 font-black text-gray-900">
                            ₹{prod.price}
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="text-[10px] text-gray-400 line-through block font-normal">
                                ₹{prod.originalPrice}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`font-bold ${
                                prod.stock <= 5 ? "text-amber-600" : "text-gray-900"
                              }`}
                            >
                              {prod.stock}
                            </span>
                            {prod.stock <= 5 && prod.stock > 0 && (
                              <span className="block text-[10px] text-amber-600 font-semibold">
                                Low Stock
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 font-bold text-gray-800">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{prod.ratingsAverage ?? 4.8}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleStock(prod._id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
                                isInStock
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                              title="Click to toggle in-stock / out-of-stock"
                            >
                              {isInStock ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> In Stock
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Out of Stock
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1">
                            <Link
                              href={`/seller/dashboard/products/${prod._id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors inline-block"
                              title="View Product Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/seller/dashboard/products/add?edit=${prod._id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-block"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteConfirmId(prod._id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div>
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, productsTotal)} of {productsTotal} products
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-gray-800 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Grid / Card View (Screen 2 in Figma) ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((prod) => {
              const isInStock = prod.inStock ?? prod.stock > 0;
              return (
                <div
                  key={prod._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-50 mb-3 border border-gray-100">
                      <img
                        src={getProductImage(prod)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleToggleStock(prod._id)}
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isInStock
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {isInStock ? "In Stock" : "Out"}
                      </button>
                    </div>

                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {prod.category}
                    </p>
                    <Link
                      href={`/seller/dashboard/products/${prod._id}`}
                      className="text-xs font-bold text-gray-900 hover:text-[#0C831F] line-clamp-2 mt-0.5"
                    >
                      {prod.name}
                    </Link>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {prod.unit || "1 pack"}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-gray-900">
                        ₹{prod.price}
                      </span>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <span className="text-[10px] text-gray-400 line-through ml-1">
                          ₹{prod.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/seller/dashboard/products/add?edit=${prod._id}`}
                        className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteConfirmId(prod._id)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-scaleUp">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-gray-900">Delete Product?</h3>
              <p className="text-xs text-gray-500 mt-1">
                This item will be removed from your catalog and will no longer appear to customers.
              </p>
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
