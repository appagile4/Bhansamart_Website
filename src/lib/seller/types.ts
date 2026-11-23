/**
 * Seller Hub types — shaped after the backend Mongoose models
 * (Bhansamart_backend/src/models/*.js) and controller responses.
 */

// ─── Orders ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderItem {
  _id?: string;
  product?: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  weight?: string;
  category?: string;
}

export interface OrderAddress {
  addressLine: string;
  city?: string;
  street?: string;
  houseNo?: string;
  landmark?: string;
  phone?: string;
  type?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RiderSummary {
  _id: string;
  fullName?: string;
  name?: string;
  phone?: string;
  vehicleDetails?: { vehicleType?: string; registrationNumber?: string };
  metrics?: { completedDeliveries?: number; rating?: number };
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  reason?: string;
}

export interface RefundRecord {
  _id: string;
  refundNumber?: string;
  order?: string | { _id: string; orderNumber?: string; totalAmount?: number; paymentMethod?: string; orderStatus?: string };
  orderNumber?: string;
  customer?: { _id: string; name?: string; phone?: string; email?: string } | string;
  claimType: string;
  amount: number;
  originalPaymentMethod?: string;
  reason?: string;
  description?: string;
  status: string;
  isVendorFunded?: boolean;
  items?: OrderItem[];
  vendorReview?: { decision?: string; notes?: string; respondedAt?: string };
  vendorPaymentDetails?: { paymentMethod?: string; transactionReference?: string };
  pickup?: {
    status?: string;
    isPickupChargeDebited?: boolean;
    pickupCharge?: number;
    pickupChargeTxRef?: string;
  };
  inspection?: { status?: string; condition?: string; notes?: string };
  customerPayoutDetails?: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    payoutReference?: string;
  };
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerOrder {
  _id: string;
  orderNumber: string;
  customer?: { _id: string; name?: string; phone?: string; email?: string } | null;
  /** Present on socket payloads */
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  totalCount?: number;
  itemsTotal?: number;
  handlingCharge?: number;
  deliveryCharge?: number;
  discount?: number;
  totalAmount: number;
  deliveryAddress?: OrderAddress;
  paymentMethod?: string;
  paymentStatus?: string;
  refundStatus?: string;
  refundDetails?: RefundRecord | null;
  orderStatus: OrderStatus;
  rejectionReason?: string;
  statusHistory?: StatusHistoryEntry[];
  assignedDeliveryBoy?: RiderSummary | null;
  assignmentStatus?: string | null;
  vendorPickupOtp?: string | null;
  /** Set by the backend when dispatch estimates arrival (app: delivery card "ETA") */
  estimatedDeliveryTime?: string | null;
  deliveredAt?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrdersPage {
  data: SellerOrder[];
  total: number;
  pendingCount: number;
}

// ─── Dashboard / finance ────────────────────────────────────────────────

export interface SellerMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSales: number;
  totalEarned: number;
  availableWithdrawalBalance: number;
  pendingSettlement: number;
  codCashWithDeliveryBoys: number;
  pendingRecoveries: number;
  platformCommissionRate: number;
  storeRating: number;
}

export interface SellerNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  /** Populated ({ _id, orderNumber, … }) by GET /vendor/notifications; a plain id elsewhere (dashboard stats, socket) */
  order?: string | { _id: string; orderNumber?: string; totalAmount?: number; orderStatus?: string } | null;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SellerStats {
  storeName: string;
  deliveryRadiusKm: number;
  isStoreOpen: boolean;
  metrics: SellerMetrics;
  recentOrders: SellerOrder[];
  recentNotifications: SellerNotification[];
  unreadNotificationsCount: number;
}

export interface SellerTransaction {
  _id: string;
  type: string;
  amount: number;
  grossAmount?: number;
  commission?: number;
  commissionRate?: number;
  netAmount?: number;
  paymentMethod?: string;
  status: string;
  notes?: string;
  bankReference?: string;
  rejectionReason?: string;
  order?: { _id: string; orderNumber?: string; totalAmount?: number } | string | null;
  deliveryBoy?: { _id: string; fullName?: string; phone?: string } | string | null;
  createdAt: string;
}

export interface SellerWallet {
  withdrawableBalance: number;
  totalEarned: number;
  pendingSettlement: number;
  codCashWithDeliveryBoys: number;
  pendingRecoveries?: number;
}

export interface TransactionsPage {
  wallet: SellerWallet;
  transactions: SellerTransaction[];
  total: number;
}

export interface CodRiderDue {
  deliveryBoy: { _id: string; fullName?: string; phone?: string; codCashInCustody?: number };
  totalDue: number;
  ordersCount: number;
  orders: Array<{ _id: string; orderNumber: string; totalAmount: number; deliveredAt?: string; customerName?: string }>;
}

export interface CodHandoverReceipt {
  _id: string;
  receiptNumber: string;
  deliveryBoy?: { _id: string; fullName?: string; phone?: string };
  amountDue?: number;
  amountSubmitted: number;
  remainingBalance?: number;
  paymentMode?: string;
  status?: string;
  notes?: string;
  createdAt: string;
}

export interface CodSummary {
  totalCodPendingSubmission: number;
  ridersCount: number;
  ridersDue: CodRiderDue[];
  discrepantOrdersCount: number;
  discrepantOrders: Array<{
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    riderName: string;
    riderPhone: string;
    discrepancy?: { hasDiscrepancy?: boolean; shortfallAmount?: number; reason?: string };
    status?: string;
  }>;
  recentHandovers: CodHandoverReceipt[];
}

export interface PaymentQrSettings {
  qrCodeUrl: string;
  upiId: string;
  accountName: string;
  acceptQrPayments: boolean;
}

export interface SellerCustomer {
  _id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  orderCount: number;
  productCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  lastAddress?: string;
}

// ─── Catalogue ──────────────────────────────────────────────────────────

export interface ProductImage {
  url: string;
  publicId?: string | null;
  altText?: string;
}

export interface ProductVariant {
  id?: string;
  type: string;
  weightUnit: string;
  weightValue: string;
  color: string;
  price?: number;
  sku?: string;
  stock?: number;
}

export interface ProductAttribute {
  attributeId?: string;
  name: string;
  value?: string;
  values?: string[];
}

export interface SellerProduct {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  category: string;
  subCategory?: string;
  supplierName?: string;
  brand?: string;
  brandRef?: string | { _id: string; name: string; logo?: string };
  expirationDate?: string;
  price: number;
  originalPrice?: number;
  discountCategory?: string;
  discountValue?: number;
  sku?: string;
  stock: number;
  reorderLevel?: number;
  unit?: string;
  inStock?: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  tags?: string[];
  status?: string;
  visibility?: { isFeatured?: boolean; isBestSeller?: boolean; isNewArrival?: boolean };
  views?: number;
  ordersCount?: number;
  refundsCount?: number;
  conversionRate?: number;
  returnRefundRate?: number;
  isReturnable?: boolean;
  returnWindowDays?: number;
  isReplaceable?: boolean;
  isRefundable?: boolean;
  ratingsAverage?: number;
  ratingsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductsPage {
  products: SellerProduct[];
  total: number;
}

export interface ProductReview {
  _id: string;
  rating: number;
  comment?: string;
  userName?: string;
  userAvatar?: string;
  isVerifiedBuyer?: boolean;
  createdAt: string;
}

export interface ProductReviewsPage {
  count: number;
  averageRating: number;
  breakdown?: Record<string, number>;
  percentages?: Record<string, number>;
  reviews: ProductReview[];
}

export interface Brand {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  categories: string[];
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isGlobal?: boolean;
  rejectionReason?: string;
  createdAt?: string;
}

export interface BrandLogoResult {
  name: string;
  logoUrl: string;
  domain?: string;
  source?: string;
}

export interface Attribute {
  _id: string;
  name: string;
  slug?: string;
  categories: string[];
  values: string[];
  type?: "single" | "multiple" | "text";
  status?: string;
  isGlobal?: boolean;
}

export interface SellerSubCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  displayOrder?: number;
}

export interface SellerCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
  subCategories?: SellerSubCategory[];
}
