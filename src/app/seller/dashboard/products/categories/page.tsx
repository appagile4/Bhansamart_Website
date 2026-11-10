"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";
import VendorLayout from "@/components/vendor/VendorLayout";

interface CategoryRow {
  id: string;
  name: string;
  subCategories: string[];
  itemsCount: number;
  status: boolean;
  image?: string;
}

const DEFAULT_CATEGORIES: CategoryRow[] = [
  {
    id: "c1",
    name: "Grocery & Kitchen",
    subCategories: ["Fresh Produce & Dairy", "Atta, Rice & Dal", "Oils & Masalas"],
    itemsCount: 142,
    status: true,
  },
  {
    id: "c2",
    name: "Snacks & Drinks",
    subCategories: ["Chips & Crisps", "Chocolates & Sweets", "Cold Drinks & Juices"],
    itemsCount: 118,
    status: true,
  },
  {
    id: "c3",
    name: "Beauty & Personal Care",
    subCategories: ["Skin Care", "Hair Care", "Oral Hygiene"],
    itemsCount: 65,
    status: true,
  },
  {
    id: "c4",
    name: "Household Essentials",
    subCategories: ["Detergents & Cleaners", "Paper & Tissues", "Pest Control"],
    itemsCount: 48,
    status: true,
  },
  {
    id: "c5",
    name: "Stationery & Crafts",
    subCategories: ["Writing Supplies", "Notebooks & Paper", "Adhesives"],
    itemsCount: 29,
    status: true,
  },
  {
    id: "c6",
    name: "Bakery & Biscuits",
    subCategories: ["Bread & Pav", "Cookies & Rusk", "Cakes & Muffins"],
    itemsCount: 37,
    status: true,
  },
];

export default function CategoryListPage() {
  const [categories, setCategories] = useState<CategoryRow[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal Form States
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newSubCatName, setNewSubCatName] = useState("");
  const [newSubCatDesc, setNewSubCatDesc] = useState("");

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: !c.status } : c))
    );
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: CategoryRow = {
      id: `c_${Date.now()}`,
      name: newCatName.trim(),
      subCategories: newSubCatName.trim() ? [newSubCatName.trim()] : ["General"],
      itemsCount: 0,
      status: true,
    };

    setCategories([newCat, ...categories]);
    setNewCatName("");
    setNewCatDesc("");
    setNewSubCatName("");
    setNewSubCatDesc("");
    setShowAddModal(false);
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
              <Link href="/seller/dashboard/products" className="hover:text-gray-700">
                Product Management
              </Link>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Category List</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Category List
            </h1>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* ── Search Toolbar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* ── Categories Table (Matching Figma Screen 5) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Sub Categories</th>
                  <th className="px-5 py-3.5">Active Items</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-[#0C831F] flex items-center justify-center font-bold">
                          {cat.name[0]}
                        </div>
                        <span className="font-bold text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {cat.subCategories.map((sub, i) => (
                          <span
                            key={i}
                            className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-600 font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">
                      {cat.itemsCount} products
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider cursor-pointer ${
                          cat.status
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {cat.status ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(cat.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0C831F] hover:bg-green-50 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Add New Category Modal (Matching Frame 1984077856 in Figma) ── */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-100 animate-scaleUp">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">
                  Add New Category
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Organic Dairy & Milks"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe this category..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs p-3 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Initial Sub-Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Farm Fresh Milk"
                    value={newSubCatName}
                    onChange={(e) => setNewSubCatName(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs"
                  >
                    Create Category
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
