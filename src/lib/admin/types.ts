/**
 * Super Admin types — shaped after Bhansamart_backend/src/controllers/adminManagementController.js,
 * staffAdminOperationsController.js and vendorBroadcastController.js responses.
 */

export interface Paged<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────

export interface AdminKpi {
  vendors: { total: number; active: number; pendingVerification: number };
  customers: { total: number; active: number };
  deliveryBoys: { total: number; online: number };
  orders: { total: number; completed: number; pending: number; cancelled: number; grossSales: number; deliveredSales: number };
  finances: {
    commissionRate: number;
    grossTransactions: number;
    netCommissionEarned: number;
    vendorGrossEarnings: number;
    vendorWalletBalances: number;
    vendorPendingSettlements: number;
    totalRefundDeductions: number;
    totalWithdrawalsPaid: number;
    pendingWithdrawalsCount: number;
  } | null;
  tickets: { open: number };
}

export interface PaymentBreakdownRow {
  _id: string | null;
  count: number;
  amount: number;
}

export interface AdminDashboardStats {
  isSuperAdmin: boolean;
  kpi: AdminKpi;
  paymentBreakdown: PaymentBreakdownRow[];
}

export interface DailyTrend {
  _id: string; // YYYY-MM-DD
  ordersCount: number;
  sales: number;
}

// ─── Vendors ─────────────────────────────────────────────────────────────

export interface VendorWallet {
  currentBalance: number;
  totalEarned: number;
  pendingSettlement: number;
  codCashWithDeliveryBoys: number;
  pendingRecoveries: number;
}

export interface AdminVendor {
  _id: string;
  userId?: { _id: string; name?: string; email?: string; phone?: string; isActive?: boolean } | null;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
    businessEmail?: string;
    businessPhone?: string;
    categories?: string[];
    verificationStatus?: string;
  };
  sellerDetails?: { sellerName?: string; sellerEmail?: string; sellerPhone?: string; address?: string; city?: string; state?: string; pincode?: string };
  brandDetails?: { brandName?: string; brandLogo?: string };
  bankDetails?: { accountHolderName?: string; accountNumber?: string; ifscCode?: string; bankName?: string; branch?: string };
  shippingLocations?: { warehouseAddress?: string; city?: string; state?: string; pincode?: string; latitude?: number; longitude?: number };
  kycDetails?: { avatarUrl?: string | null; documents?: { aadhaar?: string | null; drivingLicence?: string | null } };
  paymentSettings?: { qrCodeUrl?: string; upiId?: string; accountName?: string; acceptQrPayments?: boolean };
  status: string; // approved | pending | rejected | draft (active → approved)
  verificationStatus?: string;
  isStoreOpen: boolean;
  deliveryRadiusKm?: number;
  adminRemark?: string;
  assignedAdmin?: { name?: string; email?: string } | null;
  totalOrders?: number;
  deliveredOrders?: number;
  totalGrossSales?: number;
  wallet: VendorWallet;
  createdAt?: string;
}

export interface VendorDetailOrder {
  _id: string;
  orderNumber: string;
  customer?: { _id: string; name?: string; phone?: string; email?: string } | null;
  items?: Array<{ name: string; quantity: number; price: number; imageUrl?: string }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  commissionAmount?: number;
  vendorNetAmount?: number;
  itemsCount?: number;
  createdAt: string;
}

export interface VendorClaim {
  _id: string;
  refundNumber: string;
  claimType: string;
  status: string;
  amount: number;
  vendorDeduction: number;
  commissionReversal: number;
  reason: string;
  description?: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  createdAt: string;
}

export interface VendorProductTxn {
  _id: string;
  type: string;
  orderId?: string | null;
  orderNumber: string;
  customerName: string;
  itemsSummary: string;
  itemsCount: number;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface AdminWithdrawal {
  _id: string;
  vendor?: {
    _id: string;
    businessDetails?: { businessName?: string };
    sellerDetails?: { sellerName?: string; sellerPhone?: string };
    bankDetails?: AdminVendor["bankDetails"];
    wallet?: Partial<VendorWallet>;
  } | string | null;
  type: string;
  amount: number;
  status: string;
  notes?: string;
  bankReference?: string;
  internalNotes?: string;
  escalationStatus?: string;
  rejectionReason?: string;
  reviewedBy?: { name?: string; email?: string; role?: string } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminTicket {
  _id: string;
  ticketNumber?: string;
  raisedBy?: { _id: string; name?: string; email?: string; phone?: string; role?: string } | string | null;
  userRole?: string;
  category?: string;
  priority?: string;
  subject: string;
  description?: string;
  order?: { _id: string; orderNumber?: string } | string | null;
  vendor?: { _id: string; businessDetails?: { businessName?: string } } | string | null;
  assignedAdmin?: { _id: string; name?: string } | string | null;
  status: string;
  messages?: Array<{ sender?: { name?: string } | string; senderRole?: string; message: string; createdAt: string }>;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminVendorDetails {
  vendor: AdminVendor;
  stats: { productsCount: number; activeProductsCount: number; ordersCount: number; deliveredOrders: number; cancelledOrders: number; uniqueCustomersCount: number };
  financials: {
    totalGrossSales: number;
    totalCommissionPaid: number;
    netEarnings: number;
    currentWalletBalance: number;
    pendingWithdrawalsCount: number;
    pendingWithdrawalsAmount: number;
    totalWithdrawalsPaid: number;
  };
  customers: Array<{ _id: string; name: string; email: string; phone: string; ordersCount: number; totalSpent: number; lastOrderDate?: string }>;
  orders: VendorDetailOrder[];
  recentOrders: VendorDetailOrder[];
  productTransactions: VendorProductTxn[];
  claims: {
    totalClaims: number;
    refundsCount: number;
    returnsCount: number;
    replacementsCount: number;
    pendingClaimsCount: number;
    completedClaimsCount: number;
    totalRefundAmount: number;
    list: VendorClaim[];
  };
  products: Array<{ _id?: string; name: string; ordersCount?: number; price?: number; stock?: number; images?: Array<{ url: string }>; [k: string]: unknown }>;
  withdrawals: AdminWithdrawal[];
  tickets: { list: AdminTicket[]; openTicketsCount: number; riskLevel?: string; riskReason?: string };
  assignedAdmin: { name?: string; email?: string } | null;
}

// ─── Staff admins ────────────────────────────────────────────────────────

export const ADMIN_PERMISSION_KEYS = [
  "canManageVendors",
  "canEditProducts",
  "canManageTickets",
  "canViewOrders",
  "canSendNotifications",
  "canViewAnalytics",
  "canReviewWithdrawals",
  "canReviewBrands",
  "canExamineRefunds",
  "canReconcileCod",
  "canTrackDeliveries",
  "canBroadcastToAssignedVendors",
  "canBroadcastToSpecificVendors",
  "canBroadcastToAllVendors",
] as const;
export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];
export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export interface StaffAdmin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  adminPermissions?: Partial<AdminPermissions>;
  assignedVendors: Array<{ _id: string; businessDetails?: { businessName?: string }; brandDetails?: { brandLogo?: string }; sellerDetails?: { sellerName?: string }; isStoreOpen?: boolean }>;
  assignedVendorsCount?: number;
  openTickets?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

// ─── Customers ───────────────────────────────────────────────────────────

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  rewardPoints?: number;
  totalOrders: number;
  completedOrders: number;
  totalSpend: number;
}

// ─── Catalog ─────────────────────────────────────────────────────────────

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  level: number;
  parentCategory?: { _id: string; name: string; slug: string } | string | null;
  isActive: boolean;
  displayOrder?: number;
  productCount?: number;
}

export interface AdminProduct {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  sku?: string;
  stock: number;
  unit?: string;
  images?: Array<{ url: string }>;
  variants?: Array<{ name?: string; value?: string; price?: number; stock?: number; sku?: string }>;
  attributes?: Array<{ name?: string; value?: string }>;
  tags?: string[];
  status?: string;
  isActive: boolean;
  rating?: number;
  numReviews?: number;
  ordersCount?: number;
  vendor?: { _id: string; businessDetails?: { businessName?: string }; sellerDetails?: { sellerName?: string; sellerPhone?: string }; storeName?: string; status?: string } | null;
  brandRef?: { _id: string; name?: string; logo?: string; status?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LedgerTxn {
  _id: string;
  vendor?: { _id: string; businessDetails?: { businessName?: string }; sellerDetails?: { sellerName?: string; sellerPhone?: string } } | null;
  order?: { _id: string; orderNumber?: string; totalAmount?: number; paymentMethod?: string; orderStatus?: string } | null;
  deliveryBoy?: { _id: string; name?: string; phone?: string } | null;
  type: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  notes?: string;
  bankReference?: string;
  commissionAmount?: number;
  createdAt: string;
}

export interface AdminCustomerDetails {
  customer: AdminCustomer & { addresses?: unknown[]; avatar?: string };
  metrics: {
    totalOrders: number;
    completedOrders: number;
    activeOrders: number;
    cancelledOrders: number;
    totalCompletedSpending: number;
    totalRefundedAmount: number;
    netSpending: number;
    lastPurchaseDate?: string | null;
  };
  orders: Array<{
    _id: string;
    orderNumber: string;
    vendor?: { _id: string; businessDetails?: { businessName?: string } } | null;
    assignedDeliveryBoy?: { fullName?: string; phone?: string } | null;
    totalAmount: number;
    orderStatus: string;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt: string;
  }>;
  mostPurchasedProducts: Array<{ productId: string; name: string; imageUrl?: string; totalQuantity: number; totalSpent: number; orderCount: number }>;
  vendorSpendingSummary: Array<{ vendorId: string; businessName: string; orderCount: number; totalSpent: number; completedCount: number }>;
  deliveryHistory: Array<{ deliveryBoyId: string; fullName: string; phone?: string; deliveriesCount: number; lastDeliveryAt?: string | null }>;
  codHistory: Array<{ orderId: string; orderNumber: string; amountDue: number; amountCollected?: number; status: string; vendorConfirmed: boolean; discrepancy?: unknown; createdAt: string }>;
  refunds: Array<{ _id: string; refundNumber?: string; status: string; amount?: number; refundAmount?: number; reason?: string; claimType?: string; order?: { orderNumber?: string } | null; vendor?: { businessDetails?: { businessName?: string } } | null; createdAt: string }>;
}

export interface AuditLogEntry {
  _id: string;
  actor?: { _id: string; name?: string; email?: string } | string | null;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  targetResource?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, unknown>;
  details?: unknown;
  createdAt: string;
}

export interface QueueBrand {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  categories?: string[];
  status: string;
  reviewerNotes?: string;
  rejectionReason?: string;
  reviewedBy?: { name?: string; email?: string } | null;
  reviewedAt?: string;
  vendor?: { _id?: string; storeName?: string; brandDetails?: { brandLogo?: string } };
  similarityWarning?: string | null;
  createdAt: string;
}

export interface SalesAnalytics {
  metrics: {
    totalOrders: number;
    grossSales: number;
    completedSales: number;
    netSales: number;
    codSales: number;
    onlineSales: number;
    cancelledOrdersCount: number;
    refundsCount: number;
    totalRefundAmount: number;
    returnRefundRate: number;
  };
  ordersByStatus: Array<{ _id: string; count: number }>;
  categorySales: Array<{ category: string; unitsSold: number; revenue: number }>;
  topProducts: Array<{ productId: string; name: string; imageUrl?: string; price: number; unitsSold: number; revenue: number }>;
  timeline: Array<{ date: string; sales: number; orders: number }>;
}

export interface ProductPerformance {
  _id: string;
  name: string;
  title?: string;
  sku?: string;
  imageUrl?: string;
  category?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  unitsSold: number;
  returnedUnits: number;
  grossSales: number;
  netSales: number;
  lastSaleDate?: string;
}

export interface AdminRider {
  _id: string;
  name: string;
  fullName?: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  availability?: string;
  approvalStatus?: string;
  isOnline: boolean;
  isBusy: boolean;
  cashInHand: number;
  vehicleNumber: string;
  vehicleDetails?: { vehicleType?: string; registrationNumber?: string };
  completedDeliveries: number;
  metrics?: { rating?: number; totalDeliveries?: number };
  activeOrderId?: { orderNumber?: string; totalAmount?: number; orderStatus?: string } | null;
  address?: { city?: string };
  user?: { isActive?: boolean } | null;
}

export interface CodReconRow {
  deliveryBoyId?: string;
  deliveryBoyName: string;
  phone?: string;
  vendorId?: string;
  vendorName: string;
  ordersCount: number;
  expectedCod: number;
  totalCollected: number;
  totalHandedOver: number;
  totalVendorConfirmed: number;
  outstanding: number;
  discrepanciesCount: number;
  discrepancies: Array<{ orderId: string; orderNumber: string; expectedAmount: number; actualAmount: number; shortfall: number; reason?: string; reportedAt?: string }>;
  reconciliationStatus: string;
  handoversCount: number;
  recentReceipts?: string[];
  orders: Array<{ orderId: string; orderNumber: string; amountDue: number; amountCollected: number; amountHandedOver: number; status: string; vendorConfirmed: boolean; cashCollectedAt?: string }>;
}

export interface CodReconSummary {
  totalGroups: number;
  totalOrders: number;
  totalExpectedCod: number;
  totalCollected: number;
  totalHandedOver: number;
  totalVendorConfirmed: number;
  totalOutstanding: number;
  totalDiscrepancies: number;
}

export interface MapVendor { id: string; type: "vendor"; name: string; phone?: string; latitude: number; longitude: number; isOpen: boolean; radiusKm: number }
export interface MapRider { id: string; type: "delivery_partner"; name: string; phone?: string; latitude: number; longitude: number; availability?: string; isOnline: boolean; isBusy: boolean; lastUpdated?: string }

export interface RefundTimelineEntry { status: string; actorRole?: string; actorName?: string; notes?: string; timestamp?: string }
export interface RefundClaim {
  _id: string;
  refundNumber?: string;
  orderNumber?: string;
  order?: { _id: string; orderNumber?: string; totalAmount?: number; paymentMethod?: string; shippingAddress?: { fullName?: string; phone?: string } } | null;
  vendor?: { _id: string; businessDetails?: { businessName?: string }; brandDetails?: { brandName?: string } } | null;
  customer?: { _id: string; name?: string; phone?: string; email?: string } | null;
  amount: number;
  status: string;
  claimType?: string;
  reason?: string;
  description?: string;
  proofImages?: string[];
  images?: string[];
  isVendorFunded?: boolean;
  originalPaymentMethod?: string;
  customerPayoutDetails?: {
    method?: string;
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    payoutReference?: string;
    payoutCompletedAt?: string;
  };
  vendorReview?: { decision?: string; notes?: string };
  staffReview?: { isExamined?: boolean; notes?: string; forwardedToFinance?: boolean; decision?: string; reviewerName?: string };
  pickup?: { required?: boolean; status?: string; notes?: string; deliveryBoy?: { _id: string; fullName?: string; phone?: string } | string | null; otp?: string; otpExpiresAt?: string; isOtpVerified?: boolean };
  inspection?: { required?: boolean; result?: string; notes?: string };
  timeline?: RefundTimelineEntry[];
  createdAt: string;
}
export interface RefundSummary { total: number; pending: number; approved: number; completed: number; rejected: number; vendorCount?: number; myCount?: number }
