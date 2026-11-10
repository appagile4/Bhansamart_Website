"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  ShoppingCart,
  Boxes,
  Truck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  toggleProductStock,
  deleteVendorProduct,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

function ProductDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data && data.product) {
          setProduct(data.product);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleToggle = async () => {
    if (!product) return;
    await dispatch(toggleProductStock(product._id));
    setProduct((prev: any) => ({
      ...prev,
      inStock: !prev.inStock,
      stock: !prev.inStock ? 10 : 0,
    }));
  };

  const handleDelete = async () => {
    if (!product) return;
    if (confirm("Are you sure you want to delete this product?")) {
      await dispatch(deleteVendorProduct(product._id));
      router.push("/seller/dashboard/products");
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="p-12 text-center text-gray-400">Loading product details...</div>
      </VendorLayout>
    );
  }

  if (!product) {
    return (
      <VendorLayout>
        <div className="p-12 text-center">
          <p className="text-sm font-bold text-gray-700">Product not found</p>
          <Link
            href="/seller/dashboard/products"
            className="mt-3 inline-block px-4 py-2 bg-[#0C831F] text-white rounded-xl text-xs font-bold"
          >
            Back to Products
          </Link>
        </div>
      </VendorLayout>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images.map((img: any) => (typeof img === "string" ? img : img.url))
      : ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"];

  const isInStock = product.inStock ?? product.stock > 0;

  return (
    <VendorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Breadcrumb & Top Controls ── */}
        <div className="flex items-center justify-between">
          <nav className="text-xs text-gray-400 flex items-center gap-1.5">
            <Link href="/seller/dashboard" className="hover:text-gray-700">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/seller/dashboard/products" className="hover:text-gray-700">
              Product Management
            </Link>
            <span>/</span>
            <span className="text-[#0C831F] font-bold">Product Detail</span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`/seller/dashboard/products/add?edit=${product._id}`}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-3.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* ── Main Detail Card ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              <img
                src={images[activeImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === i
                        ? "border-[#0C831F] ring-2 ring-green-100"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {product.category} {product.subCategory ? `• ${product.subCategory}` : ""}
                </span>
                <button
                  onClick={handleToggle}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isInStock
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isInStock ? "In Stock" : "Out of Stock"}
                </button>
              </div>

              <h1 className="text-2xl font-black text-gray-900 mt-2">
                {product.name}
              </h1>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {product.description ||
                  "Freshly stocked daily from certified local sources. Meets all food safety standards."}
              </p>

              {/* Price Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-semibold uppercase block">
                    Selling Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-gray-900">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-green-100 text-[#0C831F]">
                  Pack: {product.unit || "1 pack"}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-[11px] text-gray-400 font-semibold block">
                    Available Stock
                  </span>
                  <span className="text-lg font-black text-gray-900 mt-0.5 block">
                    {product.stock ?? 0}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-[11px] text-gray-400 font-semibold block">
                    Total Orders
                  </span>
                  <span className="text-lg font-black text-gray-900 mt-0.5 block">
                    {product.totalOrders ?? 24}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <span className="text-[11px] text-gray-400 font-semibold block">
                    Rating
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-0.5 font-black text-gray-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{product.ratingsAverage ?? 4.8}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleToggle}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {isInStock ? "Mark Out of Stock" : "Mark In Stock"}
              </button>
              <Link
                href={`/seller/dashboard/products/add?edit=${product._id}`}
                className="flex-1 py-3 rounded-xl bg-[#0C831F] text-white text-xs font-bold text-center hover:bg-[#0A701A] transition-colors"
              >
                Edit Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">Loading product...</div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
