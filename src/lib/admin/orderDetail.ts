/**
 * Order details (app: staffadminScreens/OrdersScreen "Extended Order Detail" modal).
 * GET /orders/:id — admins get the full document; staff admins only for their assigned stores.
 */
import { adminRequest } from "./api";

export interface AdminOrderDetail {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totalAmount: number;
  itemsTotal?: number;
  deliveryCharge?: number;
  discount?: number;
  createdAt: string;
  deliveredAt?: string;
  customer?: { _id: string; name?: string; email?: string; phone?: string; avatar?: string } | null;
  customerInsights?: { totalCompletedOrders?: number; totalCompletedSpending?: number; lastPurchaseDate?: string | null };
  deliveryAddress?: { addressLine?: string; city?: string; street?: string; houseNo?: string; landmark?: string; phone?: string };
  vendor?: {
    _id: string;
    businessDetails?: { businessName?: string; businessPhone?: string };
    sellerDetails?: { sellerPhone?: string };
    shippingLocations?: { warehouseAddress?: string };
  } | null;
  assignedDeliveryBoy?: { _id: string; fullName?: string; phone?: string } | null;
  deliveryAssignments?: Array<{ status?: string }>;
  deliveryEarning?: number;
  items?: Array<{ name?: string; productName?: string; quantity: number; price: number }>;
  codTracking?: {
    amountDue?: number;
    amountCollected?: number;
    status?: string;
    vendorConfirmed?: boolean;
    handoverReceipt?: string;
    discrepancy?: { hasDiscrepancy?: boolean; shortfall?: number; reason?: string };
  };
  codDetails?: { amountDue?: number; amountCollected?: number; status?: string };
  paymentDetails?: { gatewayTransactionId?: string };
  refunds?: Array<{
    _id: string;
    refundNumber?: string;
    status: string;
    reason?: string;
    amount?: number;
    totalAmount?: number;
    customerPayoutDetails?: { method?: string; upiId?: string; accountNumber?: string; bankName?: string };
    vendorPaymentDetails?: { transactionReference?: string };
  }>;
}

export async function getOrderDetail(id: string): Promise<AdminOrderDetail> {
  const r = await adminRequest<{ data?: AdminOrderDetail } & Partial<AdminOrderDetail>>(`/orders/${encodeURIComponent(id)}`);
  return (r.data || r) as AdminOrderDetail;
}
