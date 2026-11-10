"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import AddressModal from "@/components/AddressModal";
import CartDrawer from "@/components/CartDrawer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addToCart,
  removeFromCart,
  clearCart,
} from "@/redux/slices/cartSlice";
import { openAddressModal } from "@/redux/slices/addressSlice";
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Plus,
  Minus,
  Sparkles,
  CreditCard,
  Banknote,
  Wallet,
  Building,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Info,
  Phone,
  Home,
  Check,
} from "lucide-react";

const getProductImg = (p: {
  imageUrl?: string;
  images?: Array<{ url: string }>;
}): string => {
  return p.imageUrl || (p.images && p.images[0]?.url) || "/images/placeholder.png";
};

interface PaymentOption {
  methodKey: string;
  displayName: string;
  isEnabled: boolean;
  instructions?: string;
  maxAmount?: number;
}

const DEFAULT_METHODS: PaymentOption[] = [
  {
    methodKey: "cod",
    displayName: "Cash on delivery",
    isEnabled: true,
    instructions: "Pay with cash at your doorstep upon delivery",
    maxAmount: 10000,
  },
  {
    methodKey: "esewa",
    displayName: "eSewa Mobile Wallet",
    isEnabled: true,
    instructions: "Instant transfer via eSewa digital wallet",
  },
  {
    methodKey: "khalti",
    displayName: "Khalti Digital Wallet",
    isEnabled: true,
    instructions: "Fast and secure checkout via Khalti",
  },
  {
    methodKey: "upi",
    displayName: "UPI / QR Code Payment",
    isEnabled: true,
    instructions: "Pay via Google Pay, PhonePe, Paytm, or BHIM",
  },
  {
    methodKey: "bank_transfer",
    displayName: "Direct Bank Transfer",
    isEnabled: true,
    instructions: "Direct NEFT / IPS bank transfer to treasury",
  },
];

function CheckoutContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { items: cartMap, totalPrice } = useAppSelector(
    (state) => state.cart
  );
  const { currentAddress } = useAppSelector((state) => state.address);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const cartList = useMemo(() => Object.values(cartMap), [cartMap]);
  const totalCount = useMemo(
    () => cartList.reduce((acc, curr) => acc + curr.quantity, 0),
    [cartList]
  );

  // Client-generated Unique Idempotency Order Key
  const [orderId] = useState(() => `BM${Date.now().toString().slice(-8)}`);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Delivery Address State
  const [addressType, setAddressType] = useState<string>("Home");
  const [houseNo, setHouseNo] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [phone, setPhone] = useState<string>(() => user?.phone || "9868686868");

  // Keep phone in sync if user profile loads
  useEffect(() => {
    if (user?.phone && phone === "9868686868") {
      setPhone(user.phone);
    }
  }, [user, phone]);

  // Payment Methods
  const [paymentMethods, setPaymentMethods] =
    useState<PaymentOption[]>(DEFAULT_METHODS);
  const [selectedMethod, setSelectedMethod] = useState<string>("Cash on delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Order Confirmed State
  interface ConfirmedOrder {
    orderNumber?: string;
    totalAmount?: number;
    itemsTotal?: number;
    handlingCharge?: number;
    deliveryCharge?: number;
    estimatedDeliveryTime?: string;
    paymentMethod?: string;
  }
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  // Load Payment Methods from Backend
  useEffect(() => {
    async function loadMethods() {
      try {
        const res = await fetch("/api/checkout/payment-methods");
        if (res.ok) {
          const data = await res.json();
          if (
            data.success &&
            Array.isArray(data.data?.paymentMethods) &&
            data.data.paymentMethods.length > 0
          ) {
            setPaymentMethods(data.data.paymentMethods);
          }
        }
      } catch (e) {
        console.warn("Could not fetch payment methods from API:", e);
      }
    }
    loadMethods();
  }, []);

  // Pricing calculations
  const deliveryCharge = totalPrice > 200 || totalPrice === 0 ? 0 : 25;
  const handlingCharge = totalPrice > 0 ? 30 : 0;
  const grandTotal = totalPrice + deliveryCharge + handlingCharge;

  // Calculate total original savings if MRP is available
  const totalSavings = useMemo(() => {
    let savings = 0;
    cartList.forEach((it) => {
      if (it.product.originalPrice && it.product.originalPrice > it.product.price) {
        savings += (it.product.originalPrice - it.product.price) * it.quantity;
      }
    });
    return savings;
  }, [cartList]);

  const handleCopyOrderId = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2500);
    }
  };

  // ── Place Order Action ──
  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (cartList.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    const cleanAddress =
      currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
        ? currentAddress.addressLine
        : "Plato 19, Dwarka Sector 5, New Delhi";

    if (!cleanAddress) {
      setErrorMessage("Please choose a valid delivery address.");
      return;
    }

    if (!phone || phone.trim().length < 7) {
      setErrorMessage("Please enter a valid contact phone number for the delivery partner.");
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;

    if (!token && !isAuthenticated) {
      // Guide user to login while preserving their cart
      router.push("/login?redirect=/checkout");
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsPayload = cartList.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        originalPrice: item.product.originalPrice || item.product.price,
        name: item.product.name,
        imageUrl: getProductImg(item.product),
        weight: item.product.unit || "1 unit",
      }));

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: itemsPayload,
          deliveryAddress: {
            addressLine: cleanAddress,
            city: currentAddress.city || "New Delhi",
            phone: phone.trim(),
            houseNo: houseNo.trim(),
            landmark: landmark.trim(),
            type: addressType,
            latitude: currentAddress.lat,
            longitude: currentAddress.lng,
          },
          paymentMethod: selectedMethod,
          idempotencyKey: orderId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Order successfully created on backend!
        // Clear both Redux state and backend cart
        dispatch(clearCart());
        setConfirmedOrder(data.data || { orderNumber: orderId, totalAmount: grandTotal });
      } else {
        setErrorMessage(
          data.message ||
            "Unable to place order. Some items may be out of stock. Please check and try again."
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodIcon = (key: string) => {
    switch (key) {
      case "cod":
        return <Banknote className="w-5 h-5 text-emerald-600" />;
      case "esewa":
      case "khalti":
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case "upi":
        return <CreditCard className="w-5 h-5 text-indigo-600" />;
      case "bank_transfer":
        return <Building className="w-5 h-5 text-blue-600" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-600" />;
    }
  };

  // ── Render: Order Confirmed Celebration Screen ──
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl text-center animate-in zoom-in-95 duration-300">
            {/* Animated Success Badge */}
            <div className="w-20 h-20 bg-emerald-100 text-[#0C831F] rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 className="w-12 h-12 stroke-[2.3]" />
            </div>

            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 fill-emerald-600" />
              Order Confirmed & Sent to Store!
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Thank You For Your Order!
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Your kitchen essentials are being packed at the nearest BhansaMart hub. Our delivery partner will arrive at your doorstep in{" "}
              <strong className="text-emerald-700 font-bold">15-25 minutes</strong>.
            </p>

            {/* Order Details Card */}
            <div className="my-6 bg-slate-50 rounded-2xl p-5 border border-slate-200/70 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 text-xs">
                <span className="text-slate-500">Order Number</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  #{confirmedOrder.orderNumber || orderId}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimated Delivery</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  15-25 Mins Express Delivery
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-semibold text-slate-800">
                  {confirmedOrder.paymentMethod || selectedMethod}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Delivering To</span>
                <span className="font-semibold text-slate-800 truncate max-w-xs text-right">
                  {currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
                    ? currentAddress.addressLine
                    : "Plato 19, Dwarka Sector 5, New Delhi"}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Total Amount</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{confirmedOrder.totalAmount || grandTotal}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link
                href="/profile"
                className="flex-1 py-3 px-5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Track Order in Profile</span>
                <ChevronRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="flex-1 py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center cursor-pointer"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Empty Cart Guard ──
  if (cartList.length === 0) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-md w-full">
            <div className="w-16 h-16 bg-emerald-50 text-[#0C831F] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
              You do not have any items in your cart to checkout. Browse our wide range of groceries and kitchen essentials!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Main Checkout UI ──
  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      {/* ── 1. Global Header ── */}
      <Header />

      {/* ── 2. Breadcrumb Navigation Bar ── */}
      <div className="bg-white border-b border-slate-200/80 sticky top-20 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="w-[94%] max-w-7xl mx-auto py-3 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Return to shopping"
            >
              <ArrowLeft className="w-5 h-5 text-slate-800" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                Checkout & Review
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                {totalCount} item{totalCount > 1 ? "s" : ""} in order
              </p>
            </div>
          </div>

          {/* Reference Order ID Badge */}
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Click to copy Order ID"
          >
            <span>ID: {orderId}</span>
            {copiedOrderId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* ── 3. Main Split Content ── */}
      <main className="flex-1 w-[94%] max-w-7xl mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ════════ LEFT COLUMN: Address, Items & Payment (8 Cols) ════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            
            {/* 1. Superfast Express Delivery Guarantee Banner */}
            <div className="bg-linear-to-r from-emerald-600 to-[#0C831F] rounded-2xl p-4 text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                    <span>15-25 Mins Express Delivery</span>
                    <span className="bg-white/25 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                      Guaranteed
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-50 mt-0.5">
                    Dispatched from the nearest verified BhansaMart hub directly to your door.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Delivery Address Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Delivery Address
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                      Confirm where you want your order delivered
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(openAddressModal())}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition cursor-pointer flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Change</span>
                </button>
              </div>

              {/* Selected Street Address Display */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 mb-4">
                <div className="flex items-start gap-2.5">
                  <Home className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {currentAddress.name || "Delivery Location"}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.2 rounded-full uppercase">
                        {addressType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                      {currentAddress.addressLine && !currentAddress.addressLine.includes("GPS")
                        ? currentAddress.addressLine
                        : "Plato 19, Dwarka Sector 5, New Delhi"}
                    </p>
                    {currentAddress.city ? (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        City: {currentAddress.city}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Address Details Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Flat / House */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    House / Flat / Floor
                  </label>
                  <input
                    type="text"
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 302, Floor 3"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near City Park"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9868686868"
                      required
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition font-medium"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Tag selector */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500">
                  Tag Address:
                </span>
                {["Home", "Work", "Other"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressType(tag)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      addressType === tag
                        ? "bg-[#0C831F] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Review Order Items */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Order Items ({totalCount})
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                      Review products and adjust quantities
                    </p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cartList.map(({ product, quantity }) => (
                  <div
                    key={product._id}
                    className="py-3 flex items-center justify-between gap-3 group"
                  >
                    {/* Image & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-200/70 rounded-xl p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={getProductImg(product)}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {product.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          {product.unit || "1 unit"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-black text-slate-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price ? (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₹{product.originalPrice}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-[#0C831F] text-white rounded-xl shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(product._id))}
                          className="p-1.5 sm:p-2 hover:bg-[#0a6f1a] transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="px-2 text-xs font-extrabold min-w-6 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(addToCart(product))}
                          className="p-1.5 sm:p-2 hover:bg-[#0a6f1a] transition cursor-pointer"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <span className="text-xs font-bold text-slate-900 min-w-12 text-right">
                        ₹{(product.price || 0) * quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Payment Method Selection */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Select Payment Method
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                      Choose your preferred payment method
                    </p>
                  </div>
                </div>
              </div>

              {/* Methods Radio Cards */}
              <div className="space-y-2.5">
                {paymentMethods.map((method) => {
                  const isSelected = selectedMethod === method.displayName;

                  return (
                    <label
                      key={method.methodKey}
                      onClick={() => setSelectedMethod(method.displayName)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-emerald-50/60 border-[#0C831F] ring-2 ring-emerald-300/60 shadow-xs"
                          : "bg-white border-slate-200/80 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-white shadow-2xs" : "bg-slate-100"
                          }`}
                        >
                          {getMethodIcon(method.methodKey)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {method.displayName}
                            </span>
                            {method.methodKey === "cod" ? (
                              <span className="bg-emerald-100 text-[#0C831F] text-[10px] font-bold px-2 py-0.2 rounded-full">
                                Popular
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {method.instructions || "Safe and authenticated checkout"}
                          </p>
                        </div>
                      </div>

                      {/* Radio Circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected
                            ? "border-[#0C831F] bg-[#0C831F]"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected ? (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: Bill Summary & Place Order CTA (4 Cols) ════════ */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sticky top-36">
            
            {/* Bill Details Summary Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                Bill Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* Items Total */}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Items total</span>
                  <span className="font-bold text-slate-900">₹{totalPrice}</span>
                </div>

                {/* Delivery Charge */}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Delivery charge</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-medium">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-extrabold">FREE</span>
                    ) : (
                      `₹${deliveryCharge}`
                    )}
                  </span>
                </div>

                {/* Handling Charge */}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Handling charge</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                  <span className="font-bold text-slate-900">₹{handlingCharge}</span>
                </div>

                {/* Total Savings Badge */}
                {totalSavings > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-bold">
                    <span>Your Total Savings</span>
                    <span>-₹{totalSavings}</span>
                  </div>
                ) : null}

                {/* Grand Total */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-slate-900 block leading-tight">
                      Grand Total
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Inclusive of all taxes
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              ) : null}

              {/* Place Order CTA Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#0C831F] hover:bg-[#0a6f1a] active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-between cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs uppercase tracking-wider text-emerald-100 font-bold">
                    {selectedMethod.includes("delivery") ? "PAY ON DELIVERY" : "PAY NOW"}
                  </span>
                  <span className="text-base font-black leading-none mt-0.5">
                    ₹{grandTotal}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </span>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </div>
              </button>

              {/* Security & Cancellation Policy Notice */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>BhansaMart 100% Genuine Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Orders cannot be cancelled once dispatched for delivery. Easy replacements available at doorstep if items are damaged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <AddressModal />
      <CartDrawer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans text-xs text-slate-500">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
