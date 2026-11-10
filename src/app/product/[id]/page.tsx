"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import ProductCard, { ProductItem } from "@/components/ProductCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addToCart, removeFromCart } from "@/redux/slices/cartSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import {
  ArrowLeft,
  Star,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Heart,
  Share2,
  Check,
  Store,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const productId = params?.id as string;

  const { items: cartItems } = useAppSelector((state) => state.cart);
  const { currentAddress } = useAppSelector((state) => state.address);

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Fetch live product details from backend API
  useEffect(() => {
    if (!productId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();

        if (!res.ok || !data.success || !data.product) {
          throw new Error(data.message || "Product not found");
        }

        if (isMounted) {
          setProduct(data.product);
          setActiveImageIndex(0);

          // Fetch related category products
          const cat = data.product.category;
          if (cat) {
            const relRes = await fetch(
              `/api/products?category=${encodeURIComponent(cat)}&limit=10`
            );
            const relData = await relRes.json();
            if (relData.success && Array.isArray(relData.products)) {
              const others = relData.products.filter(
                (p: ProductItem) => (p._id || p.id) !== productId
              );
              setRelatedProducts(others.slice(0, 5));
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Gallery images list
  const images = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images.map((img) => img.url).filter(Boolean);
    }
    return ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"];
  }, [product]);

  const activeImage = images[activeImageIndex] || images[0];

  // Cart quantity for this product
  const cartQty = product ? cartItems[product._id || product.id || ""]?.quantity || 0 : 0;

  // Discount calculation
  const discountPercent =
    product && product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const savingsAmount =
    product && product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;

  const vendorName =
    product?.vendor?.businessDetails?.businessName ||
    product?.vendor?.sellerDetails?.sellerName ||
    "BhansaMart Express Hub";

  const vendorCity =
    product?.vendor?.sellerDetails?.city ||
    product?.vendor?.shippingLocations?.city ||
    "Local Fulfillment Area";

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // clipboard fallback
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Global Header ── */}
      <Header />

      {/* ── 2. Main Container ── */}
      <main className="flex-1 w-[90%] max-w-7xl mx-auto py-6 pb-20">
        
        {/* ── Breadcrumb & Back Navigation ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-emerald-700 transition">
              Home
            </Link>
            <span>/</span>
            {product?.category ? (
              <>
                <Link
                  href={`/?category=${encodeURIComponent(product.category)}`}
                  className="hover:text-emerald-700 transition capitalize"
                >
                  {product.category}
                </Link>
                <span>/</span>
              </>
            ) : null}
            {product?.subCategory ? (
              <>
                <span className="text-slate-600 capitalize">
                  {product.subCategory}
                </span>
                <span>/</span>
              </>
            ) : null}
            <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
              {product?.name || "Product"}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* ── Loading Skeleton ── */}
        {loading ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
              <div className="md:col-span-6 flex flex-col items-center">
                <div className="w-full aspect-square bg-slate-100 rounded-2xl mb-4" />
                <div className="flex gap-3 w-full">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                  <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                  <div className="w-20 h-20 bg-slate-100 rounded-xl" />
                </div>
              </div>
              <div className="md:col-span-6 flex flex-col gap-4">
                <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                <div className="h-8 bg-slate-100 rounded-md w-3/4" />
                <div className="h-5 bg-slate-100 rounded-md w-1/3" />
                <div className="h-10 bg-slate-100 rounded-md w-1/2 my-2" />
                <div className="h-12 bg-slate-100 rounded-xl w-full" />
                <div className="h-28 bg-slate-100 rounded-2xl w-full mt-4" />
              </div>
            </div>
          </div>
        ) : error || !product ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Product Not Available
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {error || "The requested item could not be retrieved from the backend catalog."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-sm rounded-xl transition shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        ) : (
          <>
            {/* ── Main Product Card (2 Columns) ── */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14">
                
                {/* ── Left Column: Image Gallery ── */}
                <div className="md:col-span-6 flex flex-col">
                  {/* Hero Image Box */}
                  <div className="relative w-full aspect-square bg-[#F8FAFC] rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-6 group">
                    {/* Discount Badge */}
                    {discountPercent ? (
                      <span className="absolute top-4 left-4 z-10 bg-[#E23744] text-white text-xs font-black px-3 py-1 rounded-full tracking-tight shadow-xs">
                        {discountPercent}% OFF
                      </span>
                    ) : null}

                    {/* Delivery Speed Badge */}
                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-extrabold text-slate-800 shadow-xs border border-slate-100">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>15-25 MINS DELIVERY</span>
                    </div>

                    {/* Action Buttons: Wishlist & Share */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className="p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-400 hover:text-red-500 shadow-xs transition-colors cursor-pointer border border-slate-100"
                        title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400"
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={handleShare}
                        className="p-2.5 rounded-full bg-white/95 hover:bg-white text-slate-500 hover:text-slate-800 shadow-xs transition-colors cursor-pointer border border-slate-100 relative"
                        title="Share Product"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                        {copied ? (
                          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[11px] font-semibold px-2 py-1 rounded whitespace-nowrap shadow-xs">
                            Link copied!
                          </span>
                        ) : null}
                      </button>
                    </div>

                    {/* Image Preview with Smooth Zoom */}
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
                    />
                  </div>

                  {/* Thumbnail Row */}
                  {images.length > 1 ? (
                    <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2">
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden p-2 bg-[#F8FAFC] border-2 transition-all cursor-pointer shrink-0 ${
                            activeImageIndex === idx
                              ? "border-[#0C831F] shadow-xs scale-102"
                              : "border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* ── Right Column: Info & Buy ── */}
                <div className="md:col-span-6 flex flex-col justify-between">
                  <div>
                    {/* Brand & Vendor Badge Row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {product.brand ? (
                        <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {product.brand}
                        </span>
                      ) : null}
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>Sold by {vendorName}</span>
                      </span>
                    </div>

                    {/* Product Name */}
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                      {product.name}
                    </h1>

                    {/* Weight / Pack Size */}
                    <div className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-lg mb-4">
                      {product.unit || "1 pack"}
                    </div>

                    {/* Ratings & Reviews */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-900">
                          {(product.ratingsAverage || 4.8).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        ({product.ratingsCount || 310} verified customer reviews)
                      </span>
                    </div>

                    {/* Pricing Box */}
                    <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4 sm:p-5 mb-6">
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <span className="text-base sm:text-lg text-slate-400 line-through font-medium">
                            ₹{product.originalPrice}
                          </span>
                        ) : null}
                        {discountPercent ? (
                          <span className="bg-emerald-100 text-[#0C831F] text-xs font-black px-2.5 py-1 rounded-full">
                            Save ₹{savingsAmount} ({discountPercent}% OFF)
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-1.5">
                        Inclusive of all taxes • Instant delivery applicable at checkout
                      </p>
                    </div>

                    {/* Stock Status & Cart Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
                      {cartQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => dispatch(addToCart(product))}
                          className="flex-1 py-3.5 px-8 bg-[#0C831F] hover:bg-[#0a6f1a] active:scale-98 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          <span>Add to Cart</span>
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center justify-between bg-[#0C831F] text-white rounded-2xl px-4 py-2.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => dispatch(removeFromCart(product._id || product.id || ""))}
                            className="p-2 hover:bg-[#0a6f1a] rounded-xl transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-black">{cartQty} in cart</span>
                            <span className="text-[10px] text-emerald-100 font-medium">
                              ₹{product.price * cartQty} total
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => dispatch(addToCart(product))}
                            className="p-2 hover:bg-[#0a6f1a] rounded-xl transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold shrink-0">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span>In Stock • Ready to dispatch</span>
                      </div>
                    </div>

                    {/* Express Delivery Box */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3.5 mb-6 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                            Superfast 15-25 Mins Delivery
                          </h4>
                          <button
                            type="button"
                            onClick={() => dispatch(openAddressModal())}
                            className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 truncate max-w-sm">
                          Delivering to: <span className="font-semibold text-slate-800">{currentAddress.addressLine}</span>
                        </p>
                      </div>
                    </div>

                    {/* Seller Information Card */}
                    <div className="bg-[#FAFBFD] border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {vendorName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {vendorCity} • Verified Partner
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700 block">
                          99.4%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Fulfillment rate
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Product Specifications & Description ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              
              {/* Left: Detailed Description */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Product Description & Highlights
                  </h3>
                </div>

                <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
                  <p>
                    {product.description ||
                      product.shortDescription ||
                      "Every item at BhansaMart is picked with care from authorized regional distribution partners, guaranteeing maximum freshness, hygienic storage, and unmatched product purity."}
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase">
                        Category
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {product.category || "General Grocery"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase">
                        Subcategory
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {product.subCategory || "Daily Essentials"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase">
                        Unit / Pack Size
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {product.unit || "1 pack"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl">
                      <span className="text-[11px] text-slate-400 font-bold block uppercase">
                        Brand
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {product.brand || "BhansaMart Selection"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Why Shop With BhansaMart */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-4">
                    Why shop on BhansaMart?
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 fill-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          15-25 Mins Express Delivery
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Dispatched immediately from your local neighbourhood warehouse.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          100% Genuine & Hygienic
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Directly sourced from trusted brands and local farmers.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          Easy Returns & Refunds
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                          Hassle-free replacement at your doorstep on damaged items.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400 font-medium">
                    Questions? 24x7 Customer Support available via BhansaMart Help Center
                  </p>
                </div>
              </div>

            </div>

            {/* ── Related / Similar Products Carousel ── */}
            {relatedProducts.length > 0 ? (
              <div className="my-8">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Similar Products You Might Like
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      More items from {product.category || "this category"}
                    </p>
                  </div>

                  <Link
                    href={`/?category=${encodeURIComponent(product.category || "all")}`}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    View All →
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {relatedProducts.map((relProd) => (
                    <ProductCard
                      key={relProd._id || relProd.id}
                      product={relProd}
                      quantity={cartItems[relProd._id || relProd.id || ""]?.quantity || 0}
                      onAddToCart={(p) => dispatch(addToCart(p))}
                      onRemoveFromCart={(p) => dispatch(removeFromCart(p._id || p.id || ""))}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* ── 3. Modals ── */}
      <AddressModal />
      <CartDrawer />
    </div>
  );
}

function ProductPageFallback() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <div className="w-full h-20 bg-white border-b border-slate-200/70" />
      <main className="flex-1 w-[90%] max-w-7xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-6 aspect-square bg-slate-100 rounded-2xl" />
            <div className="md:col-span-6 space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-10 bg-slate-100 rounded w-3/4" />
              <div className="h-8 bg-slate-100 rounded w-1/4" />
              <div className="h-12 bg-slate-100 rounded-xl w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<ProductPageFallback />}>
      <ProductDetailContent />
    </Suspense>
  );
}
