/** Formatting + status presentation shared by Seller Hub pages (mirrors the app's vendor screens). */

/** The app shows all money as "NPR 1,234". */
export const npr = (value?: number | null) =>
  `NPR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "—";

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString([], { dateStyle: "medium" }) : "—";

export const formatTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

export const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : formatDate(iso);
};

export const initials = (name?: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

export interface Badge {
  label: string;
  /** Tailwind classes for background, text and border */
  cls: string;
}

/** Order status colours & labels — app: getStatusColor / getStatusBadge */
export const orderStatusBadge = (status?: string, long = false): Badge => {
  switch (status) {
    case "PLACED":
      return { label: long ? "Pending Acceptance" : "Pending", cls: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]" };
    case "ACCEPTED":
    case "PREPARING":
      return { label: long ? "Preparing Order" : "Preparing", cls: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]" };
    case "READY_FOR_PICKUP":
      return { label: long ? "Ready for Pickup" : "Ready", cls: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]" };
    case "OUT_FOR_DELIVERY":
      return { label: "Out for Delivery", cls: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]" };
    case "DELIVERED":
      return { label: long ? "Delivered" : "Completed", cls: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]" };
    case "REJECTED":
    case "CANCELLED":
      return { label: long ? "Cancelled / Declined" : "Cancelled", cls: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]" };
    default:
      return { label: status || "Unknown", cls: "bg-slate-100 text-slate-600 border-slate-300" };
  }
};

/** Orders list filter tabs — app: FILTER_TABS, mapped to backend `status` query values */
export const ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export type OrderTabKey = (typeof ORDER_TABS)[number]["key"];

export const orderMatchesTab = (status: string, tab: OrderTabKey) => {
  switch (tab) {
    case "pending":
      return status === "PLACED";
    case "preparing":
      return status === "ACCEPTED" || status === "PREPARING";
    case "ready":
      return status === "READY_FOR_PICKUP";
    case "completed":
      return status === "DELIVERED";
    case "cancelled":
      return status === "CANCELLED" || status === "REJECTED";
    default:
      return true;
  }
};

/** Map a free-form ?status= value (from sidebar links / app routes) onto a tab key. */
export const toOrderTab = (raw?: string | null): OrderTabKey => {
  const s = (raw || "").toLowerCase();
  if (s === "pending" || s === "new") return "pending";
  if (s === "preparing" || s === "accepted") return "preparing";
  if (s === "ready" || s === "ready_for_pickup") return "ready";
  if (s === "completed" || s === "delivered") return "completed";
  if (s === "cancelled" || s === "rejected") return "cancelled";
  return "all";
};

/** Decline reasons offered by the app's order screens */
export const DECLINE_REASONS = ["Items Out of Stock", "Store Busy"] as const;

/** Transaction type labels */
export const TXN_LABELS: Record<string, string> = {
  ORDER_EARNING: "Order Earning",
  COD_COLLECTION: "COD Collected by Rider",
  COD_HANDOVER: "COD Cash Handover",
  WITHDRAWAL: "Withdrawal",
  WITHDRAWAL_REQUEST: "Withdrawal Request",
  WITHDRAWAL_PAYOUT: "Withdrawal Payout",
  PLATFORM_FEE: "Platform Fee",
  DIRECT_QR_PAYMENT: "Direct QR Payment",
  REFUND_DEDUCTION: "Refund Deduction",
  COMMISSION_REVERSAL: "Commission Reversal",
  COMMISSION_DEDUCTION: "Commission Deduction",
  RECOVERY_ADJUSTMENT: "Recovery Adjustment",
  VENDOR_DIRECT_REFUND: "Direct Customer Refund",
  RETURN_PICKUP_CHARGE: "Return Pickup Charge",
};

/** Debit-type transactions reduce the wallet */
export const isDebitTxn = (type: string) =>
  [
    "WITHDRAWAL",
    "WITHDRAWAL_REQUEST",
    "WITHDRAWAL_PAYOUT",
    "PLATFORM_FEE",
    "REFUND_DEDUCTION",
    "COMMISSION_DEDUCTION",
    "RECOVERY_ADJUSTMENT",
    "VENDOR_DIRECT_REFUND",
    "RETURN_PICKUP_CHARGE",
  ].includes(type);

export const txnStatusBadge = (status: string): Badge => {
  switch (status) {
    case "SETTLED":
    case "COMPLETED":
    case "DIRECT_SETTLED":
    case "RECOVERED":
      return { label: status.replace(/_/g, " "), cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "PENDING":
    case "SUBMITTED":
      return { label: status, cls: "bg-amber-50 text-amber-700 border-amber-200" };
    case "CASH_IN_CUSTODY":
      return { label: "Cash in custody", cls: "bg-violet-50 text-violet-700 border-violet-200" };
    case "FAILED":
    case "REVERSED":
    case "REJECTED":
    case "DECLINED":
      return { label: status, cls: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { label: status.replace(/_/g, " "), cls: "bg-slate-100 text-slate-600 border-slate-300" };
  }
};

export const refundStatusBadge = (status: string): Badge => {
  if (["COMPLETED", "VENDOR_PAID"].includes(status))
    return { label: status.replace(/_/g, " "), cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (["REJECTED", "VENDOR_REJECTED", "FAILED", "INSPECTED_FAILED"].includes(status))
    return { label: status.replace(/_/g, " "), cls: "bg-red-50 text-red-700 border-red-200" };
  if (["REQUESTED", "VENDOR_REVIEW", "VENDOR_INFO_REQUIRED"].includes(status))
    return { label: status.replace(/_/g, " "), cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: status.replace(/_/g, " "), cls: "bg-sky-50 text-sky-700 border-sky-200" };
};

/** First usable image URL for a product */
export const productImage = (p?: { images?: Array<{ url?: string } | string> }) => {
  const first = p?.images?.[0];
  if (!first) return "";
  return typeof first === "string" ? first : first.url || "";
};

export const isLowStock = (p: { stock: number; reorderLevel?: number; inStock?: boolean }) =>
  p.inStock !== false && p.stock > 0 && p.stock <= (p.reorderLevel || 5);

export const isOutOfStock = (p: { stock: number; inStock?: boolean }) => p.inStock === false || p.stock <= 0;
