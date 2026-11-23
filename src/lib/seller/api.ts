/**
 * Typed Seller Hub API client. Every call goes through the Next.js `/api/*`
 * proxies to the BhansaMart backend with the vendor's bearer token attached.
 * Endpoints mirror the app's services (Bhansamart_frontend/src/store/services/*).
 */
import type {
  Attribute,
  Brand,
  BrandLogoResult,
  CodSummary,
  OrdersPage,
  PaymentQrSettings,
  ProductReviewsPage,
  ProductsPage,
  RefundRecord,
  SellerCustomer,
  SellerNotification,
  SellerOrder,
  SellerProduct,
  SellerCategory,
  SellerSubCategory,
  SellerStats,
  TransactionsPage,
} from "./types";

export class SellerApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getVendorToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return (
      localStorage.getItem("bhansa_vendor_token") ||
      localStorage.getItem("vendor_token")
    );
  } catch {
    return null;
  }
};

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  json?: unknown;
  form?: FormData;
}

const buildQuery = (query?: Query) => {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
};

/** Fired (on window) after anything that can change the vendor's image-storage usage. lib/seller/storage.ts listens. */
export const STORAGE_CHANGED_EVENT = "bhansa:vendor-storage-changed";
const touchesStorage = (path: string, opts: RequestOptions) =>
  Boolean(opts.form) ||
  (opts.method === "DELETE" && path.startsWith("/products")) ||
  ((opts.method === "PUT" || opts.method === "POST") &&
    path.startsWith("/vendor/payment-qr"));
const announceStorageChange = () => {
  if (typeof window !== "undefined")
    setTimeout(
      () => window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT)),
      400,
    );
};

/** Low-level request: throws SellerApiError with the backend's message on failure. */
export async function sellerRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  try {
    return await sellerRequestRaw<T>(path, opts);
  } finally {
    // uploads (success or quota error), product deletes and QR changes all move the storage meter
    if (touchesStorage(path, opts)) announceStorageChange();
  }
}

async function sellerRequestRaw<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getVendorToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}${buildQuery(opts.query)}`, {
      method: opts.method || (body ? "POST" : "GET"),
      headers,
      body,
      cache: "no-store",
    });
  } catch {
    throw new SellerApiError(
      "Network error. Please check your connection and try again.",
      0,
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  const payload = (data || {}) as {
    success?: boolean;
    message?: string;
    errors?: Array<{ message?: string }>;
  };
  // Gateway / Cloudflare errors (502, 503, 504, 520–524): the backend itself is down or unreachable
  if (
    [502, 503, 504, 520, 521, 522, 523, 524].includes(res.status) &&
    !payload.message
  ) {
    throw new SellerApiError(
      "Can't reach the BhansaMart server right now. Please try again in a few minutes.",
      res.status,
    );
  }
  if (!res.ok || payload.success === false) {
    const message =
      payload.message ||
      payload.errors?.[0]?.message ||
      `Request failed (${res.status}).`;
    throw new SellerApiError(message, res.status);
  }
  return data as T;
}

type Ok<T> = { success: true; message?: string } & T;

// ─── Dashboard & store ───────────────────────────────────────────────────

export async function getDashboardStats(): Promise<SellerStats> {
  const r = await sellerRequest<Ok<{ data: SellerStats }>>(
    "/vendor/dashboard/stats",
  );
  return r.data;
}

export async function setStoreOpen(isStoreOpen: boolean) {
  return sellerRequest<Ok<{ data?: unknown }>>("/vendor/store-status", {
    method: "PUT",
    json: { isStoreOpen },
  });
}

export async function setDeliveryRadius(deliveryRadiusKm: number) {
  return sellerRequest<Ok<{ data?: unknown }>>("/vendor/delivery-radius", {
    method: "PUT",
    json: { deliveryRadiusKm },
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────

/** status: all | pending | preparing | ready | completed | cancelled | OUT_FOR_DELIVERY … (backend maps these) */
export async function getVendorOrders(
  query: { status?: string; page?: number; limit?: number } = {},
): Promise<OrdersPage> {
  const r = await sellerRequest<
    Ok<{ data: SellerOrder[]; total: number; pendingCount: number }>
  >("/orders/vendor/live", {
    query: { limit: 100, ...query },
  });
  return {
    data: r.data || [],
    total: r.total || 0,
    pendingCount: r.pendingCount || 0,
  };
}

/** Every order for this store (walks the backend's 100-per-page limit; capped at `maxPages`). */
export async function getAllVendorOrders(
  maxPages = 20,
): Promise<SellerOrder[]> {
  const all: SellerOrder[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const r = await sellerRequest<
      Ok<{ data: SellerOrder[]; totalPages?: number }>
    >("/orders/vendor/live", {
      query: { status: "all", limit: 100, page },
    });
    all.push(...(r.data || []));
    if (!r.data?.length || page >= (r.totalPages || 1)) break;
  }
  return all;
}

export async function getOrderById(id: string): Promise<SellerOrder> {
  const r = await sellerRequest<Ok<{ data: SellerOrder }>>(
    `/orders/${encodeURIComponent(id)}`,
  );
  return r.data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  reason?: string,
): Promise<SellerOrder | null> {
  const r = await sellerRequest<Ok<{ data?: SellerOrder }>>(
    `/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      json: { status, reason },
    },
  );
  return r.data || null;
}

// ─── Refunds / return claims ─────────────────────────────────────────────

export async function vendorAcknowledgeClaim(id: string, notes?: string) {
  return sellerRequest<Ok<{ data?: RefundRecord }>>(
    `/refunds/${encodeURIComponent(id)}/vendor-acknowledge`,
    {
      method: "PATCH",
      json: {
        notes: notes || "Store acknowledged claim and initiated resolution.",
      },
    },
  );
}

export async function vendorDirectRefundPayout(
  id: string,
  payload: {
    transactionReference: string;
    paymentMethod: "UPI" | "BANK_TRANSFER" | "CASH";
    notes?: string;
  },
) {
  return sellerRequest<Ok<{ data?: RefundRecord }>>(
    `/refunds/${encodeURIComponent(id)}/vendor-direct-payout`,
    {
      method: "PATCH",
      json: payload,
    },
  );
}

// ─── Products ────────────────────────────────────────────────────────────

export interface ProductQuery {
  search?: string;
  category?: string;
  status?: string;
  stockStatus?: "all" | "in_stock" | "out_of_stock";
  minPrice?: number;
  maxPrice?: number;
  sortBy?:
    | "default"
    | "price_asc"
    | "price_desc"
    | "alpha"
    | "newest"
    | "oldest";
  page?: number;
  limit?: number;
}

export async function getMyProducts(
  query: ProductQuery = {},
): Promise<ProductsPage> {
  const r = await sellerRequest<
    Ok<{ products: SellerProduct[]; total: number }>
  >("/products/my-products", {
    query: { limit: 200, ...query } as Query,
  });
  return { products: r.products || [], total: r.total || 0 };
}

export async function getProduct(id: string): Promise<SellerProduct> {
  const r = await sellerRequest<
    Ok<{ data?: SellerProduct; product?: SellerProduct }>
  >(`/products/${encodeURIComponent(id)}`);
  const p = r.data || r.product;
  if (!p) throw new SellerApiError("Product not found.", 404);
  return p;
}

export async function createProduct(
  form: FormData,
): Promise<SellerProduct | null> {
  const r = await sellerRequest<
    Ok<{ data?: SellerProduct; product?: SellerProduct }>
  >("/products", { method: "POST", form });
  return r.data || r.product || null;
}

export async function updateProduct(
  id: string,
  body: FormData | Record<string, unknown>,
): Promise<SellerProduct | null> {
  const r = await sellerRequest<
    Ok<{ data?: SellerProduct; product?: SellerProduct }>
  >(`/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    ...(body instanceof FormData ? { form: body } : { json: body }),
  });
  return r.data || r.product || null;
}

export async function toggleProductStock(
  id: string,
): Promise<{ inStock: boolean; status?: string }> {
  const r = await sellerRequest<Ok<{ inStock: boolean; status?: string }>>(
    `/products/${encodeURIComponent(id)}/toggle-stock`,
    { method: "PATCH" },
  );
  return { inStock: r.inStock, status: r.status };
}

export async function getProductReviews(
  id: string,
): Promise<ProductReviewsPage> {
  const r = await sellerRequest<Ok<ProductReviewsPage>>(
    `/products/${encodeURIComponent(id)}/reviews`,
  );
  return {
    count: r.count || 0,
    averageRating: r.averageRating || 0,
    breakdown: r.breakdown,
    percentages: r.percentages,
    reviews: r.reviews || [],
  };
}

export async function deleteProductReview(productId: string, reviewId: string) {
  return sellerRequest<Ok<object>>(
    `/products/${encodeURIComponent(productId)}/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
}

// ─── Brands & attributes ────────────────────────────────────────────────

export async function getBrands(
  query: { category?: string; search?: string; limit?: number } = {},
): Promise<Brand[]> {
  const r = await sellerRequest<Ok<{ brands?: Brand[]; data?: Brand[] }>>(
    "/brands",
    { query: { limit: 100, ...query } },
  );
  return r.brands || r.data || [];
}

/** Logo suggestions for a brand name (backend route is /brands/logo-search). */
export async function searchBrandLogos(q: string): Promise<BrandLogoResult[]> {
  const r = await sellerRequest<Ok<{ data: BrandLogoResult[] }>>(
    "/brands/logo-search",
    { query: { q } },
  );
  return r.data || [];
}

export async function getMyBrandRequests(): Promise<Brand[]> {
  const r = await sellerRequest<Ok<{ data: Brand[] }>>(
    "/vendor/brand-requests",
  );
  return r.data || [];
}

/** Request a new brand. Pass a logo File, or a logoUrl picked from logo search. */
export async function createBrandRequest(input: {
  name: string;
  categories: string[];
  description?: string;
  logoFile?: File | null;
  logoUrl?: string;
}) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("categories", JSON.stringify(input.categories));
  if (input.description) form.append("description", input.description);
  if (input.logoFile) form.append("logo", input.logoFile);
  else if (input.logoUrl) form.append("logoUrl", input.logoUrl);
  return sellerRequest<Ok<{ data?: Brand }>>("/vendor/brand-requests", {
    method: "POST",
    form,
  });
}

export async function getAttributes(
  query: { category?: string; search?: string } = {},
): Promise<Attribute[]> {
  const r = await sellerRequest<
    Ok<{ attributes?: Attribute[]; data?: Attribute[] }>
  >("/attributes", { query });
  return r.attributes || r.data || [];
}

export async function createAttribute(input: {
  name: string;
  categories: string[];
  values: string[];
  type: "single" | "multiple" | "text";
}) {
  return sellerRequest<Ok<{ data?: Attribute }>>("/vendor/attributes", {
    method: "POST",
    json: input,
  });
}

/** Dynamic categories & sub-categories fetched from the backend catalog. */
export async function getCategories(): Promise<SellerCategory[]> {
  try {
    const res = await fetch("/api/categories", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) return json.data;
      if (Array.isArray(json?.categories) && json.categories.length > 0) return json.categories;
      if (Array.isArray(json?.sections) && json.sections.length > 0) {
        return json.sections.map((s: any) => ({
          _id: s.id,
          name: s.title,
          slug: s.id,
          description: s.badge || "",
          image: s.imageUrl || "",
          subCategories: (s.items || []).map((it: any) => ({
            _id: it.id,
            name: it.name,
            slug: it.slug || it.id,
            image: it.imageUrl || "",
          })),
        }));
      }
    }
  } catch (err) {
    console.error("Failed to load dynamic categories:", err);
  }
  return [];
}

// ─── Finance ─────────────────────────────────────────────────────────────

export async function getTransactions(
  query: { type?: string; status?: string; limit?: number } = {},
): Promise<TransactionsPage> {
  const r = await sellerRequest<
    Ok<{
      data: {
        wallet: TransactionsPage["wallet"];
        transactions: TransactionsPage["transactions"];
        pagination?: { total?: number };
      };
    }>
  >("/vendor/transactions", { query: { limit: 100, ...query } });
  return {
    wallet: r.data?.wallet || {
      withdrawableBalance: 0,
      totalEarned: 0,
      pendingSettlement: 0,
      codCashWithDeliveryBoys: 0,
    },
    transactions: r.data?.transactions || [],
    total: r.data?.pagination?.total || r.data?.transactions?.length || 0,
  };
}

export async function requestWithdrawal(amount: number, notes?: string) {
  return sellerRequest<Ok<{ data?: { remainingBalance?: number } }>>(
    "/vendor/wallet/withdraw",
    {
      method: "POST",
      json: { amount, notes },
    },
  );
}

export async function getCodSummary(): Promise<CodSummary> {
  const r = await sellerRequest<Ok<{ data: CodSummary }>>(
    "/vendor/cod/due-by-riders",
  );
  return {
    totalCodPendingSubmission: r.data?.totalCodPendingSubmission || 0,
    ridersCount: r.data?.ridersCount || 0,
    ridersDue: r.data?.ridersDue || [],
    discrepantOrdersCount: r.data?.discrepantOrdersCount || 0,
    discrepantOrders: r.data?.discrepantOrders || [],
    recentHandovers: r.data?.recentHandovers || [],
  };
}

export interface CodHandoverResult {
  receiptNumber?: string;
  amountSubmitted?: number;
  remainingBalance?: number;
  shortfall?: number;
  hasShortfall?: boolean;
  paymentMode?: string;
}

export async function confirmCodHandover(input: {
  deliveryBoyId: string;
  amountSubmitted: number;
  paymentMode: "CASH" | "UPI";
  notes?: string;
  discrepancyReason?: string;
}) {
  return sellerRequest<Ok<{ data: CodHandoverResult }>>(
    "/vendor/cod/confirm-handover",
    { method: "POST", json: input },
  );
}

export async function getPaymentQr(): Promise<PaymentQrSettings> {
  const r =
    await sellerRequest<Ok<{ data: Partial<PaymentQrSettings> }>>(
      "/vendor/payment-qr",
    );
  return {
    qrCodeUrl: r.data?.qrCodeUrl || "",
    upiId: r.data?.upiId || "",
    accountName: r.data?.accountName || "",
    acceptQrPayments: Boolean(r.data?.acceptQrPayments),
  };
}

export async function updatePaymentQr(input: Partial<PaymentQrSettings>) {
  return sellerRequest<Ok<{ data: PaymentQrSettings }>>("/vendor/payment-qr", {
    method: "PUT",
    json: input,
  });
}

export async function uploadPaymentQrImage(file: File) {
  const form = new FormData();
  form.append("qrCode", file);
  return sellerRequest<Ok<{ data?: PaymentQrSettings }>>(
    "/vendor/payment-qr/upload",
    { method: "POST", form },
  );
}

// ─── Customers & notifications ───────────────────────────────────────────

export async function getCustomers(): Promise<SellerCustomer[]> {
  const r =
    await sellerRequest<Ok<{ data: SellerCustomer[] }>>("/vendor/customers");
  return r.data || [];
}

export async function getNotifications(
  query: { limit?: number } = {},
): Promise<{ notifications: SellerNotification[]; unreadCount: number }> {
  const r = await sellerRequest<
    Ok<{ data: { notifications: SellerNotification[]; unreadCount: number } }>
  >("/vendor/notifications", {
    query: { limit: 100, ...query },
  });
  return {
    notifications: r.data?.notifications || [],
    unreadCount: r.data?.unreadCount || 0,
  };
}

export async function markNotificationRead(id: string) {
  return sellerRequest<Ok<object>>(
    `/vendor/notifications/${encodeURIComponent(id)}/read`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead() {
  return sellerRequest<Ok<object>>("/vendor/notifications/read-all", {
    method: "PATCH",
  });
}

/** Normalise any thrown value to a user-facing message. */
export const errorText = (
  err: unknown,
  fallback = "Something went wrong. Please try again.",
) => (err instanceof Error && err.message ? err.message : fallback);

// ─── Image storage (backend: routes/storageRoutes.js → /vendor/storage) ──

export interface StorageUsageInfo {
  usedBytes: number;
  quotaBytes: number;
  freeBytes: number;
  percent: number;
  assetCount: number;
  alertLevels: number[];
  isFull: boolean;
  breakdown: Array<{ kind: string; bytes: number; count: number }>;
  largest: Array<{
    _id: string;
    url: string;
    bytes: number;
    kind: string;
    createdAt: string;
  }>;
  pendingRecharge: StorageRecharge | null;
}
export interface StoragePlan {
  id: string;
  name: string;
  extraBytes: number;
  amount: number;
  currency: string;
  description?: string;
}
export interface StorageRecharge {
  _id: string;
  planId: string;
  planName: string;
  extraBytes: number;
  amount: number;
  currency: string;
  paymentProvider: string;
  paymentRef?: string;
  vendorNote?: string;
  status: "PENDING" | "PAID" | "APPROVED" | "REJECTED";
  adminNote?: string;
  reviewedAt?: string | null;
  quotaBefore?: number | null;
  quotaAfter?: number | null;
  createdAt: string;
}

export async function getMyStorage(): Promise<StorageUsageInfo> {
  const r =
    await sellerRequest<Ok<{ data: StorageUsageInfo }>>("/vendor/storage");
  return r.data;
}
export async function getStoragePlans(): Promise<{
  plans: StoragePlan[];
  paymentProvider: string;
  requiresAdminApproval: boolean;
}> {
  const r = await sellerRequest<
    Ok<{
      data: {
        plans: StoragePlan[];
        paymentProvider: string;
        requiresAdminApproval: boolean;
      };
    }>
  >("/vendor/storage/plans");
  return r.data;
}
export async function getMyStorageRecharges(): Promise<StorageRecharge[]> {
  const r = await sellerRequest<Ok<{ data: StorageRecharge[] }>>(
    "/vendor/storage/recharges",
  );
  return r.data || [];
}
export async function requestStorageRecharge(input: {
  planId: string;
  paymentRef?: string;
  note?: string;
}) {
  return sellerRequest<Ok<{ data: StorageRecharge }>>(
    "/vendor/storage/recharge",
    { method: "POST", json: input },
  );
}
/** True when an upload failed because the vendor's image storage is full (HTTP 413 from the quota check). */
export const isStorageQuotaError = (err: unknown) =>
  (err instanceof SellerApiError && err.status === 413) ||
  /image storage/i.test(err instanceof Error ? err.message : String(err || ""));
