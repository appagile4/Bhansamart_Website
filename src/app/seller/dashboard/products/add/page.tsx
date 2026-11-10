"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  UploadCloud,
  X,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchVendorProducts } from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const dispatch = useAppDispatch();
  const { vendorToken } = useAppSelector((state) => state.vendor);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Dairy, Bread & Eggs");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [supplierName, setSupplierName] = useState("");

  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountCategory, setDiscountCategory] = useState("Percentage (%)");
  const [discountValue, setDiscountValue] = useState("");

  const [weightUnit, setWeightUnit] = useState("g");
  const [weightValue, setWeightValue] = useState("500");

  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("20");
  const [reorderLevel, setReorderLevel] = useState("5");

  const [status, setStatus] = useState("active");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  const [tags, setTags] = useState<string[]>(["Fresh", "Daily"]);
  const [tagInput, setTagInput] = useState("");

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pre-fill if editing
  useEffect(() => {
    if (editId) {
      const fetchEditProduct = async () => {
        try {
          const res = await fetch(`/api/products/${editId}`);
          const data = await res.json();
          if (data && data.product) {
            const p = data.product;
            setName(p.name || "");
            setDescription(p.description || "");
            setCategory(p.category || "Dairy, Bread & Eggs");
            setSubCategory(p.subCategory || "");
            setBrand(p.brand || "");
            setSupplierName(p.supplierName || "");
            setPrice(String(p.price || ""));
            setOriginalPrice(String(p.originalPrice || ""));
            setStock(String(p.stock || "0"));
            setReorderLevel(String(p.reorderLevel || "5"));
            if (p.images && p.images.length > 0) {
              setImages(
                p.images.map((img: any) =>
                  typeof img === "string" ? img : img.url
                )
              );
            }
          }
        } catch {
          // ignore
        }
      };
      fetchEditProduct();
    }
  }, [editId]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setErrorMsg("Valid selling price is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token =
        vendorToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("bhansa_vendor_token")
          : null);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        subCategory: subCategory.trim() || undefined,
        brand: brand.trim() || undefined,
        supplierName: supplierName.trim() || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        discountCategory,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        stock: parseInt(stock, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 5,
        unit: `${weightValue} ${weightUnit}`,
        sku: sku.trim() || undefined,
        status,
        visibility: {
          isFeatured,
          isBestSeller,
          isNewArrival,
        },
        tags,
        images:
          images.length > 0
            ? images.map((url) => ({ url, altText: name }))
            : [
                {
                  url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
                  altText: name,
                },
              ],
      };

      const endpoint = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to save product.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(
        editId
          ? "Product updated successfully!"
          : "Product published to catalog successfully!"
      );
      dispatch(fetchVendorProducts({}));

      setTimeout(() => {
        router.push("/seller/dashboard/products");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while saving product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VendorLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Breadcrumb & Title ── */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
              <Link href="/seller/dashboard" className="hover:text-gray-700">
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href="/seller/dashboard/products"
                className="hover:text-gray-700"
              >
                Product Management
              </Link>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">
                {editId ? "Edit Product" : "Add Product"}
              </span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Link
                href="/seller/dashboard/products"
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              {editId ? "Edit Product Details" : "Add New Product"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/seller/dashboard/products"
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-3 text-xs text-green-700 font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0C831F]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left 2 Cols: Form Sections ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. General Information */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                General Information
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Farm Red Onions / Pyaaz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe freshness, origin, benefits or usage..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 focus:bg-white text-xs p-3 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Product Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  >
                    <option value="Dairy, Bread & Eggs">Dairy, Bread & Eggs</option>
                    <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                    <option value="Snacks & Munchies">Snacks & Munchies</option>
                    <option value="Cold Drinks & Juices">Cold Drinks & Juices</option>
                    <option value="Bakery & Biscuits">Bakery & Biscuits</option>
                    <option value="Tea, Coffee & More">Tea, Coffee & More</option>
                    <option value="Atta, Rice & Dal">Atta, Rice & Dal</option>
                    <option value="Masala, Oil & More">Masala, Oil & More</option>
                    <option value="Sauces & Spreads">Sauces & Spreads</option>
                    <option value="Chicken, Meat & Fish">Chicken, Meat & Fish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Product Sub-Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fresh Vegetables"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amul, Nestle, Farm Fresh"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Wholesale / Local Farm"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Pricing Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Pricing & Discounts
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 35"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Original / MRP Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountCategory}
                    onChange={(e) => setDiscountCategory(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  >
                    <option value="Percentage (%)">Percentage (%)</option>
                    <option value="Flat Discount (₹)">Flat Discount (₹)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Weight & Inventory */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Pack Size & Inventory
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Unit Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500, 1, 250"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Measurement Unit
                  </label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="L">Litres (L)</option>
                    <option value="pack">Pack / Box</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    SKU Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ONION-RED-1KG"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-gray-50 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Col: Status, Tags, Image Uploads ── */}
          <div className="space-y-6">
            {/* Status & Visibility */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Status & Flags
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Publication Status
                </label>
                <div className="space-y-2">
                  {["active", "draft", "archived"].map((st) => (
                    <label
                      key={st}
                      className="flex items-center gap-2.5 text-xs font-semibold capitalize text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={status === st}
                        onChange={() => setStatus(st)}
                        className="text-[#0C831F] focus:ring-[#0C831F] accent-[#0C831F]"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Promotional Badges
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="text-[#0C831F] rounded accent-[#0C831F]"
                  />
                  Featured Product
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="text-[#0C831F] rounded accent-[#0C831F]"
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="text-[#0C831F] rounded accent-[#0C831F]"
                  />
                  New Arrival
                </label>
              </div>
            </div>

            {/* Product Tags */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Product Tags
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-[#0C831F] border border-green-200 text-xs font-semibold"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type tag & press enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 bg-gray-50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
              </div>
            </div>

            {/* Images Upload / Link */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                Product Photos
              </h2>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-gray-50 focus:bg-white text-xs px-3 py-2 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                >
                  Add
                </button>
              </div>

              {/* Thumbnails preview */}
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50"
                  >
                    <img src={img} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {images.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                  <p className="text-xs font-semibold">No images added</p>
                  <p className="text-[10px] mt-0.5">
                    Add image URLs above or default image will be assigned.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] active:bg-[#085C15] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <span>{editId ? "Update Product" : "Publish Product"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

export default function AddProductPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">Loading form...</div>
      }
    >
      <AddProductContent />
    </Suspense>
  );
}
