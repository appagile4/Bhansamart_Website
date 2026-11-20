/**
 * Monthly business report maths — same metric definitions as the app's report.tsx,
 * but computed only from real orders (no synthetic fallback figures).
 */
import type { SellerOrder } from "./types";

export interface MonthOption {
  key: string;
  label: string;
  short: string;
  year: number;
  month: number;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Last 12 months, newest first (app: generateMonthOptions) */
export const monthOptions = (now = new Date()): MonthOption[] =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    return { key: `${y}-${String(m + 1).padStart(2, "0")}`, label: `${MONTHS[m]} ${y}`, short: `${MONTHS[m].slice(0, 3)} ${String(y).slice(2)}`, year: y, month: m };
  });

const inMonth = (o: SellerOrder, m: MonthOption) => {
  const d = new Date(o.createdAt);
  return d.getFullYear() === m.year && d.getMonth() === m.month;
};

const isCancelled = (o: SellerOrder) => o.orderStatus === "CANCELLED" || o.orderStatus === "REJECTED";
const isCod = (o: SellerOrder) => (o.paymentMethod || "Cash on delivery").toLowerCase().includes("cash");
const units = (o: SellerOrder) => (o.items || []).reduce((n, it) => n + (it.quantity || 1), 0);

const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0);

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
  imageUrl?: string;
  category?: string;
}

export function computeMonthReport(orders: SellerOrder[], month: MonthOption, prev: MonthOption | null, commissionRate: number) {
  const cur = orders.filter((o) => inMonth(o, month));
  const before = prev ? orders.filter((o) => inMonth(o, prev)) : [];

  const kept = cur.filter((o) => !isCancelled(o));
  const cancelled = cur.filter(isCancelled);

  const grossRevenue = kept.reduce((n, o) => n + (o.totalAmount || 0), 0);
  const platformCommission = Math.round(grossRevenue * commissionRate);
  const netEarnings = grossRevenue - platformCommission;

  const products: Record<string, TopProduct> = {};
  kept.forEach((o) =>
    (o.items || []).forEach((it) => {
      const key = it.productId || it.product || it.name;
      const q = it.quantity || 1;
      products[key] = products[key] || { name: it.name || "Product", quantity: 0, revenue: 0, imageUrl: it.imageUrl, category: it.category };
      products[key].quantity += q;
      products[key].revenue += (it.price || 0) * q;
    })
  );

  const dispatched = cur.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY" || o.orderStatus === "DELIVERED" || Boolean(o.assignedDeliveryBoy)).length;
  const delivered = cur.filter((o) => o.orderStatus === "DELIVERED").length;
  const inTransit = cur.filter((o) => o.orderStatus === "OUT_FOR_DELIVERY" || o.orderStatus === "READY_FOR_PICKUP").length;
  const processed = kept.length + cancelled.length;

  const codOrders = kept.filter(isCod);
  const onlineOrders = kept.filter((o) => !isCod(o));

  const prevKept = before.filter((o) => !isCancelled(o));
  const prevGrossRevenue = prevKept.reduce((n, o) => n + (o.totalAmount || 0), 0);
  const prevOrdersCount = prevKept.length;
  const prevUnitsSold = prevKept.reduce((n, o) => n + units(o), 0);
  const unitsSold = kept.reduce((n, o) => n + units(o), 0);
  const revenueGrowthPct = pct(grossRevenue, prevGrossRevenue);

  return {
    ordersInMonth: cur.length,
    grossRevenue,
    netEarnings,
    platformCommission,
    unitsSold,
    completedOrders: kept.length,
    cancelledOrders: cancelled.length,
    cancelledUnits: cancelled.reduce((n, o) => n + units(o), 0),
    cancelledValue: cancelled.reduce((n, o) => n + (o.totalAmount || 0), 0),
    returnRate: processed ? ((cancelled.length / processed) * 100).toFixed(1) : "0.0",
    dispatched,
    delivered,
    inTransit,
    deliverySuccessRate: dispatched ? ((delivered / dispatched) * 100).toFixed(1) : "0.0",
    codRevenue: codOrders.reduce((n, o) => n + (o.totalAmount || 0), 0),
    onlineRevenue: onlineOrders.reduce((n, o) => n + (o.totalAmount || 0), 0),
    codOrdersCount: codOrders.length,
    onlineOrdersCount: onlineOrders.length,
    prevGrossRevenue,
    prevOrdersCount,
    prevUnitsSold,
    revenueGrowthPct,
    ordersGrowthPct: pct(kept.length, prevOrdersCount),
    unitsGrowthPct: pct(unitsSold, prevUnitsSold),
    isGrowing: revenueGrowthPct >= 0,
    topProducts: Object.values(products)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
}

export type MonthReport = ReturnType<typeof computeMonthReport>;
