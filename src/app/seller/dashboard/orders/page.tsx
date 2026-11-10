"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Boxes,
  User,
  MapPin,
  Phone,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
  VendorOrder,
} from "@/redux/slices/vendorSlice";
import VendorLayout from "@/components/vendor/VendorLayout";

function VendorOrdersContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";
  const verifyOrderId = searchParams.get("verify");

  const dispatch = useAppDispatch();
  const { orders, ordersLoading } = useAppSelector((state) => state.vendor);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchVendorOrders({ status: activeTab }));
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (verifyOrderId && orders.length > 0) {
      const found = orders.find((o) => o._id === verifyOrderId);
      if (found) setSelectedOrder(found);
    }
  }, [verifyOrderId, orders]);

  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    setStatusUpdating(true);
    await dispatch(updateVendorOrderStatus({ orderId, status: nextStatus }));
    setStatusUpdating(false);

    // Refresh selected order
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, orderStatus: nextStatus as any } : null
      );
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.orderNumber || o._id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.deliveryAddress?.city || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "pending") return o.orderStatus === "PLACED";
    if (activeTab === "preparing")
      return o.orderStatus === "ACCEPTED" || o.orderStatus === "PREPARING";
    if (activeTab === "ready") return o.orderStatus === "READY_FOR_PICKUP";
    if (activeTab === "completed") return o.orderStatus === "DELIVERED";
    if (activeTab === "cancelled")
      return o.orderStatus === "CANCELLED" || o.orderStatus === "REJECTED";

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return {
          bg: "bg-amber-100 text-amber-800",
          icon: <Clock className="w-3 h-3" />,
          label: "New Order",
        };
      case "ACCEPTED":
        return {
          bg: "bg-blue-100 text-blue-800",
          icon: <Boxes className="w-3 h-3" />,
          label: "Accepted",
        };
      case "PREPARING":
        return {
          bg: "bg-indigo-100 text-indigo-800",
          icon: <Boxes className="w-3 h-3" />,
          label: "Preparing",
        };
      case "READY_FOR_PICKUP":
        return {
          bg: "bg-purple-100 text-purple-800",
          icon: <Truck className="w-3 h-3" />,
          label: "Ready for Pickup",
        };
      case "OUT_FOR_DELIVERY":
        return {
          bg: "bg-cyan-100 text-cyan-800",
          icon: <Truck className="w-3 h-3" />,
          label: "Out for Delivery",
        };
      case "DELIVERED":
        return {
          bg: "bg-green-100 text-green-800",
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: "Delivered",
        };
      default:
        return {
          bg: "bg-red-100 text-red-800",
          icon: <XCircle className="w-3 h-3" />,
          label: status,
        };
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
              <span className="text-gray-500 font-medium">Order Management</span>
              <span>/</span>
              <span className="text-[#0C831F] font-bold">Orders List</span>
            </nav>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Order Management
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => dispatch(fetchVendorOrders({ status: activeTab }))}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw
                className={`w-4 h-4 ${ordersLoading ? "animate-spin text-[#0C831F]" : ""}`}
              />
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export Orders
            </button>
          </div>
        </div>

        {/* ── Tabs (Matching Figma Orders Screen) ── */}
        <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending", label: "New Orders" },
            { id: "preparing", label: "Preparing" },
            { id: "ready", label: "Ready / Dispatch" },
            { id: "completed", label: "Completed Orders" },
            { id: "cancelled", label: "Cancelled Orders" },
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
              placeholder="Search by Order ID, customer, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0C831F] focus:outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <span className="text-xs font-semibold text-gray-400">
            {filteredOrders.length} order(s) found
          </span>
        </div>

        {/* ── Orders Table (Matching Figma Screen 1 & Screen 2) ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer Name</th>
                  <th className="px-5 py-3.5">Order Date</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Total Items</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {ordersLoading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-semibold text-gray-600">No orders in this tab</p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        New orders will populate here when customers checkout.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const badge = getStatusBadge(order.orderStatus);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {order.orderNumber || order._id.slice(-8)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-gray-900">
                            {order.user?.name || "Customer"}
                          </p>
                          <p className="text-gray-400 text-[11px]">
                            {order.deliveryAddress?.city || "Local"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                          <span className="block text-[10px] text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-black text-gray-900">
                          ₹{order.totalAmount}
                        </td>
                        <td className="px-5 py-3.5 font-medium">
                          {order.items?.length || 0} item(s)
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${badge.bg}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Verify / View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Order Verify & Tracking Modal (Matching Desktop-6 & Desktop-2 in Figma) ── */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-100 overflow-hidden my-8 animate-scaleUp">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-gray-900">
                    Order Verify: {selectedOrder.orderNumber || selectedOrder._id.slice(-8)}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      getStatusBadge(selectedOrder.orderStatus).bg
                    }`}
                  >
                    {getStatusBadge(selectedOrder.orderStatus).label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Invoice
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
                {/* Left 2 Cols: Order Items & Bill Breakdown */}
                <div className="md:col-span-2 space-y-6">
                  {/* Delivery & Customer Info */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-gray-500" />
                        Customer: {selectedOrder.user?.name || "Verified Customer"}
                      </span>
                      <span className="font-semibold text-gray-500 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {selectedOrder.deliveryAddress?.phone || selectedOrder.user?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span>{selectedOrder.deliveryAddress?.addressLine || "Store Pickup"}</span>
                    </div>
                    {selectedOrder.assignedDeliveryBoy && (
                      <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-blue-700">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-4 h-4" />
                          Delivery Partner: {selectedOrder.assignedDeliveryBoy.fullName || selectedOrder.assignedDeliveryBoy.name}
                        </span>
                        <span>{selectedOrder.assignedDeliveryBoy.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items Table (Matching Figma Order Items) */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Order Items ({selectedOrder.items?.length || 0})
                    </h3>
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-2.5">Item</th>
                            <th className="px-4 py-2.5">Qty</th>
                            <th className="px-4 py-2.5">Unit Price</th>
                            <th className="px-4 py-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                {item.name || item.product?.name || "Grocery Item"}
                                <span className="block text-[10px] text-gray-400">
                                  {item.product?.unit || "1 pack"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold">{item.quantity}</td>
                              <td className="px-4 py-3 text-gray-500">₹{item.price}</td>
                              <td className="px-4 py-3 text-right font-black text-gray-900">
                                ₹{item.price * item.quantity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bill Breakdown */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal Items</span>
                      <span>₹{selectedOrder.subTotal || selectedOrder.totalAmount - 25}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery & Handling Fee</span>
                      <span>₹{selectedOrder.deliveryFee ?? 25}</span>
                    </div>
                    {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-[#0C831F] font-semibold">
                        <span>Discount / Voucher</span>
                        <span>-₹{selectedOrder.discountAmount}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-base text-gray-900">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.totalAmount}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">
                      Payment Mode:{" "}
                      <span className="font-bold text-gray-700">
                        {selectedOrder.paymentMethod || "COD"}
                      </span>{" "}
                      •{" "}
                      <span className="text-[#0C831F] font-bold">
                        {selectedOrder.paymentStatus || "PAID"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Col: Order 5-Stage Timeline & Status Control */}
                <div className="space-y-6">
                  {/* Status Actions */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Store Action
                    </h3>

                    {selectedOrder.orderStatus === "PLACED" && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleStatusChange(selectedOrder._id, "ACCEPTED")}
                          disabled={statusUpdating}
                          className="w-full py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#0A701A] text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedOrder._id, "REJECTED")}
                          disabled={statusUpdating}
                          className="w-full py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                        >
                          Reject Order
                        </button>
                      </div>
                    )}

                    {selectedOrder.orderStatus === "ACCEPTED" && (
                      <button
                        onClick={() => handleStatusChange(selectedOrder._id, "PREPARING")}
                        disabled={statusUpdating}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Start Packing / Preparing
                      </button>
                    )}

                    {selectedOrder.orderStatus === "PREPARING" && (
                      <button
                        onClick={() =>
                          handleStatusChange(selectedOrder._id, "READY_FOR_PICKUP")
                        }
                        disabled={statusUpdating}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Mark Ready for Delivery Boy
                      </button>
                    )}

                    {selectedOrder.orderStatus === "READY_FOR_PICKUP" && (
                      <div className="p-3 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold text-center">
                        Order packed and awaiting delivery rider handover.
                      </div>
                    )}

                    {selectedOrder.orderStatus === "DELIVERED" && (
                      <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Order Completed
                      </div>
                    )}
                  </div>

                  {/* 5-Stage Order Timeline (Matching Figma Order Timeline) */}
                  <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Order Timeline
                    </h3>

                    <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                      {[
                        {
                          step: 1,
                          title: "Order Placement",
                          desc: "Customer placed order",
                          done: true,
                          time: new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                        {
                          step: 2,
                          title: "Order Confirmation",
                          desc: "Vendor accepted",
                          done: selectedOrder.orderStatus !== "PLACED",
                        },
                        {
                          step: 3,
                          title: "Packing & Processing",
                          desc: "Store packed items",
                          done: [
                            "PREPARING",
                            "READY_FOR_PICKUP",
                            "OUT_FOR_DELIVERY",
                            "DELIVERED",
                          ].includes(selectedOrder.orderStatus),
                        },
                        {
                          step: 4,
                          title: "Delivery Assignment",
                          desc: "Rider assigned / pickup",
                          done: [
                            "READY_FOR_PICKUP",
                            "OUT_FOR_DELIVERY",
                            "DELIVERED",
                          ].includes(selectedOrder.orderStatus),
                        },
                        {
                          step: 5,
                          title: "Order Handover / Delivered",
                          desc: "Delivered to doorstep",
                          done: selectedOrder.orderStatus === "DELIVERED",
                        },
                      ].map((t) => (
                        <div key={t.step} className="flex items-start gap-3 relative z-10">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              t.done
                                ? "bg-[#0C831F] text-white shadow-2xs"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {t.step}
                          </div>
                          <div className="text-xs">
                            <p className="font-bold text-gray-900 leading-tight">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-gray-400">{t.desc}</p>
                            {t.time && (
                              <span className="text-[10px] font-semibold text-gray-400">
                                {t.time}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

export default function VendorOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">Loading orders...</div>
      }
    >
      <VendorOrdersContent />
    </Suspense>
  );
}
