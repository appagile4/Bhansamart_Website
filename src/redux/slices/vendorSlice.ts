import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface VendorUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: string;
}

export interface VendorProfile {
  _id: string;
  userId?: string;
  storeName?: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    categories?: string[];
    businessPhone?: string;
    businessEmail?: string;
    description?: string;
  };
  sellerDetails?: {
    sellerName?: string;
    sellerPhone?: string;
    sellerEmail?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  brandDetails?: {
    brandName?: string;
    brandLogo?: string;
  };
  shippingLocations?: {
    warehouseAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  };
  deliveryRadiusKm?: number;
  isStoreOpen?: boolean;
  status?: string;
}

export interface VendorMetrics {
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
  storeRating: number;
}

export interface VendorProduct {
  _id: string;
  name: string;
  description?: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice?: number;
  discountCategory?: string;
  discountValue?: number;
  stock: number;
  reorderLevel?: number;
  unit?: string;
  status?: string;
  inStock?: boolean;
  images?: Array<{ url: string; altText?: string } | string>;
  brand?: string;
  supplierName?: string;
  ratingsAverage?: number;
  ratingsCount?: number;
  totalOrders?: number;
  totalViews?: number;
  createdAt?: string;
}

export interface VendorOrder {
  _id: string;
  orderNumber: string;
  user?: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    _id?: string;
    product: {
      _id: string;
      name: string;
      images?: Array<{ url: string }>;
      unit?: string;
      price?: number;
    };
    quantity: number;
    price: number;
    name?: string;
  }>;
  totalAmount: number;
  subTotal?: number;
  deliveryFee?: number;
  packagingFee?: number;
  discountAmount?: number;
  orderStatus:
    | "PLACED"
    | "ACCEPTED"
    | "PREPARING"
    | "READY_FOR_PICKUP"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED"
    | "REJECTED";
  paymentMethod: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  deliveryAddress: {
    addressLine: string;
    city?: string;
    phone: string;
    landmark?: string;
    houseNo?: string;
  };
  assignedDeliveryBoy?: {
    _id: string;
    fullName?: string;
    name?: string;
    phone?: string;
    avatar?: string;
  };
  timeline?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTransactionRecord {
  _id: string;
  vendor: string;
  order?: any;
  deliveryBoy?: any;
  type: string;
  amount: number;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paymentMethod: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface VendorNotificationRecord {
  _id: string;
  vendor: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface VendorCustomer {
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
}

export interface CodDueRider {
  deliveryBoy: {
    _id: string;
    fullName: string;
    phone: string;
    codCashInCustody?: number;
  };
  totalDue: number;
  ordersCount: number;
  orders: any[];
}

interface VendorState {
  vendorToken: string | null;
  vendorUser: VendorUser | null;
  vendorProfile: VendorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // Dashboard & Domain data
  stats: VendorMetrics | null;
  statsLoading: boolean;

  products: VendorProduct[];
  productsTotal: number;
  productsLoading: boolean;

  orders: VendorOrder[];
  ordersTotal: number;
  ordersLoading: boolean;

  transactions: VendorTransactionRecord[];
  txnsLoading: boolean;

  customers: VendorCustomer[];
  customersLoading: boolean;

  notifications: VendorNotificationRecord[];
  unreadNotificationsCount: number;

  codDueRiders: CodDueRider[];

  isStoreOpen: boolean;
  deliveryRadiusKm: number;
}

const getStoredVendorToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("bhansa_vendor_token") ||
    localStorage.getItem("vendor_token") ||
    null
  );
};

const getStoredVendorUser = (): VendorUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("bhansa_vendor_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredVendorProfile = (): VendorProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("bhansa_vendor_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState: VendorState = {
  vendorToken: getStoredVendorToken(),
  vendorUser: getStoredVendorUser(),
  vendorProfile: getStoredVendorProfile(),
  isAuthenticated: !!getStoredVendorToken(),
  isLoading: false,
  error: null,
  successMessage: null,

  stats: null,
  statsLoading: false,

  products: [],
  productsTotal: 0,
  productsLoading: false,

  orders: [],
  ordersTotal: 0,
  ordersLoading: false,

  transactions: [],
  txnsLoading: false,

  customers: [],
  customersLoading: false,

  notifications: [],
  unreadNotificationsCount: 0,

  codDueRiders: [],

  isStoreOpen: true,
  deliveryRadiusKm: 10,
};

// Helper for vendor authenticated headers
const getAuthHeaders = (token?: string | null) => {
  const t = token || getStoredVendorToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (t) {
    headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
};

// ─── THUNKS ──────────────────────────────────────────────────────────

// 1. Vendor Password Login
export const loginVendorPassword = createAsyncThunk(
  "vendor/loginPassword",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Vendor login failed.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_vendor_token", data.token);
        localStorage.setItem("bhansa_vendor_user", JSON.stringify(data.user));
        if (data.vendor) {
          localStorage.setItem("bhansa_vendor_profile", JSON.stringify(data.vendor));
        }
      }

      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error during vendor login.");
    }
  }
);

// 2. Fetch My Vendor Profile
export const fetchMyVendorProfile = createAsyncThunk(
  "vendor/fetchMyProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/auth/vendor/me", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Could not fetch profile");
      }

      if (typeof window !== "undefined") {
        if (data.user) {
          localStorage.setItem("bhansa_vendor_user", JSON.stringify(data.user));
        }
        if (data.vendor) {
          localStorage.setItem("bhansa_vendor_profile", JSON.stringify(data.vendor));
        }
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error fetching vendor profile.");
    }
  }
);

// 3. Fetch Dashboard Stats
export const fetchVendorStats = createAsyncThunk(
  "vendor/fetchStats",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/dashboard/stats", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch stats");
      }
      return data.data || data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load dashboard metrics");
    }
  }
);

// 4. Fetch Vendor Products
export const fetchVendorProducts = createAsyncThunk(
  "vendor/fetchProducts",
  async (
    params:
      | {
          search?: string;
          category?: string;
          status?: string;
          stockStatus?: string;
          sortBy?: string;
          page?: number;
          limit?: number;
        }
      | void,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { vendor: VendorState };
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.category && params.category !== "All") query.set("category", params.category);
      if (params?.status && params.status !== "All") query.set("status", params.status);
      if (params?.stockStatus && params.stockStatus !== "all")
        query.set("stockStatus", params.stockStatus);
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));

      const res = await fetch(`/api/products/my-products?${query.toString()}`, {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch products");
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error loading products");
    }
  }
);

// 5. Toggle Product Stock
export const toggleProductStock = createAsyncThunk(
  "vendor/toggleStock",
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch(`/api/products/${productId}/toggle-stock`, {
        method: "PATCH",
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to toggle stock");
      }
      return { productId, product: data.product };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update stock");
    }
  }
);

// 6. Delete Product
export const deleteVendorProduct = createAsyncThunk(
  "vendor/deleteProduct",
  async (productId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to delete product");
      }
      return productId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete product");
    }
  }
);

// 7. Fetch Live Orders
export const fetchVendorOrders = createAsyncThunk(
  "vendor/fetchOrders",
  async (
    params: { status?: string; page?: number; limit?: number } | void,
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { vendor: VendorState };
      const query = new URLSearchParams();
      if (params?.status && params.status !== "All" && params.status !== "all") {
        query.set("status", params.status);
      }
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));

      const res = await fetch(`/api/orders/vendor/live?${query.toString()}`, {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch vendor orders");
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error loading orders");
    }
  }
);

// 8. Update Order Status
export const updateVendorOrderStatus = createAsyncThunk(
  "vendor/updateOrderStatus",
  async (
    { orderId, status, reason }: { orderId: string; status: string; reason?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(state.vendor.vendorToken),
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to update order status");
      }
      return { orderId, order: data.order };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update status");
    }
  }
);

// 9. Fetch Vendor Transactions
export const fetchVendorTransactions = createAsyncThunk(
  "vendor/fetchTransactions",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/transactions", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch transactions");
      }
      return data.transactions || data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error loading transactions");
    }
  }
);

// 10. Request Withdrawal
export const requestVendorWithdrawal = createAsyncThunk(
  "vendor/requestWithdrawal",
  async (
    payload: { amount: number; paymentMethod?: string; bankDetails?: any; upiId?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/wallet/withdraw", {
        method: "POST",
        headers: getAuthHeaders(state.vendor.vendorToken),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to request withdrawal");
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error requesting payout");
    }
  }
);

// 11. Fetch Vendor Customers
export const fetchVendorCustomers = createAsyncThunk(
  "vendor/fetchCustomers",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/customers", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch customers");
      }
      return data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load customers");
    }
  }
);

// 12. Fetch Notifications
export const fetchVendorNotifications = createAsyncThunk(
  "vendor/fetchNotifications",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/notifications", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch notifications");
      }
      return data.notifications || data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load notifications");
    }
  }
);

// 13. Mark Notification Read
export const markVendorNotificationRead = createAsyncThunk(
  "vendor/markNotificationRead",
  async (notificationId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch(`/api/vendor/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to mark as read");
      }
      return notificationId;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update notification");
    }
  }
);

// 14. Update Store Status (Open / Closed)
export const updateStoreStatus = createAsyncThunk(
  "vendor/updateStoreStatus",
  async (isStoreOpen: boolean, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/store-status", {
        method: "PUT",
        headers: getAuthHeaders(state.vendor.vendorToken),
        body: JSON.stringify({ isStoreOpen }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to update store status");
      }
      return isStoreOpen;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to change store status");
    }
  }
);

// 15. Update Delivery Radius (in KM)
export const updateDeliveryRadius = createAsyncThunk(
  "vendor/updateDeliveryRadius",
  async (radiusKm: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/delivery-radius", {
        method: "PUT",
        headers: getAuthHeaders(state.vendor.vendorToken),
        body: JSON.stringify({ deliveryRadiusKm: radiusKm }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to update delivery radius");
      }
      return radiusKm;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update delivery radius");
    }
  }
);

// 16. Fetch COD Due by Riders
export const fetchCodDueRiders = createAsyncThunk(
  "vendor/fetchCodDueRiders",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/cod/due-by-riders", {
        headers: getAuthHeaders(state.vendor.vendorToken),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to fetch COD riders");
      }
      return data.riders || data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load COD handover list");
    }
  }
);

// 17. Confirm COD Handover
export const confirmCodHandover = createAsyncThunk(
  "vendor/confirmCodHandover",
  async (
    payload: { deliveryBoyId: string; amountSubmitted: number; paymentMode?: string; notes?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { vendor: VendorState };
      const res = await fetch("/api/vendor/cod/confirm-handover", {
        method: "POST",
        headers: getAuthHeaders(state.vendor.vendorToken),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to confirm handover");
      }
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to confirm cash handover");
    }
  }
);

// ─── SLICE DEFINITION ──────────────────────────────────────────────────

export const vendorSlice = createSlice({
  name: "vendor",
  initialState,
  reducers: {
    logoutVendor: (state) => {
      state.vendorToken = null;
      state.vendorUser = null;
      state.vendorProfile = null;
      state.isAuthenticated = false;
      state.stats = null;
      state.products = [];
      state.orders = [];
      state.transactions = [];
      state.customers = [];
      state.notifications = [];
      state.error = null;
      state.successMessage = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("bhansa_vendor_token");
        localStorage.removeItem("bhansa_vendor_user");
        localStorage.removeItem("bhansa_vendor_profile");
        localStorage.removeItem("vendor_token");
      }
    },
    clearVendorAlerts: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setLocalStoreStatus: (state, action: PayloadAction<boolean>) => {
      state.isStoreOpen = action.payload;
    },
    setLocalDeliveryRadius: (state, action: PayloadAction<number>) => {
      state.deliveryRadiusKm = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginVendorPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginVendorPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vendorToken = action.payload.token;
        state.vendorUser = action.payload.user;
        state.vendorProfile = action.payload.vendor;
        state.isAuthenticated = true;
        state.isStoreOpen = action.payload.vendor?.isStoreOpen ?? true;
        state.deliveryRadiusKm = action.payload.vendor?.deliveryRadiusKm ?? 10;
        state.successMessage = "Vendor logged in successfully.";
      })
      .addCase(loginVendorPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Vendor login failed.";
      });

    // Profile
    builder.addCase(fetchMyVendorProfile.fulfilled, (state, action) => {
      if (action.payload.user) state.vendorUser = action.payload.user;
      if (action.payload.vendor) {
        state.vendorProfile = action.payload.vendor;
        state.isStoreOpen = action.payload.vendor.isStoreOpen ?? true;
        state.deliveryRadiusKm = action.payload.vendor.deliveryRadiusKm ?? 10;
      }
    });

    // Stats
    builder
      .addCase(fetchVendorStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchVendorStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchVendorStats.rejected, (state) => {
        state.statsLoading = false;
      });

    // Products
    builder
      .addCase(fetchVendorProducts.pending, (state) => {
        state.productsLoading = true;
      })
      .addCase(fetchVendorProducts.fulfilled, (state, action) => {
        state.productsLoading = false;
        state.products = action.payload.products || action.payload.data || [];
        state.productsTotal = action.payload.total || action.payload.count || state.products.length;
      })
      .addCase(fetchVendorProducts.rejected, (state) => {
        state.productsLoading = false;
      });

    // Toggle stock
    builder.addCase(toggleProductStock.fulfilled, (state, action) => {
      const idx = state.products.findIndex((p) => p._id === action.payload.productId);
      if (idx !== -1) {
        const prod = state.products[idx];
        prod.inStock = !prod.inStock;
        if (prod.inStock && prod.stock <= 0) prod.stock = 10;
        if (!prod.inStock) prod.stock = 0;
      }
    });

    // Delete product
    builder.addCase(deleteVendorProduct.fulfilled, (state, action) => {
      state.products = state.products.filter((p) => p._id !== action.payload);
      state.productsTotal = Math.max(0, state.productsTotal - 1);
    });

    // Orders
    builder
      .addCase(fetchVendorOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders || action.payload.data || [];
        state.ordersTotal = action.payload.total || action.payload.count || state.orders.length;
      })
      .addCase(fetchVendorOrders.rejected, (state) => {
        state.ordersLoading = false;
      });

    // Update order status
    builder.addCase(updateVendorOrderStatus.fulfilled, (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload.orderId);
      if (idx !== -1 && action.payload.order) {
        state.orders[idx] = action.payload.order;
      }
    });

    // Transactions
    builder
      .addCase(fetchVendorTransactions.pending, (state) => {
        state.txnsLoading = true;
      })
      .addCase(fetchVendorTransactions.fulfilled, (state, action) => {
        state.txnsLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchVendorTransactions.rejected, (state) => {
        state.txnsLoading = false;
      });

    // Customers
    builder
      .addCase(fetchVendorCustomers.pending, (state) => {
        state.customersLoading = true;
      })
      .addCase(fetchVendorCustomers.fulfilled, (state, action) => {
        state.customersLoading = false;
        state.customers = action.payload;
      })
      .addCase(fetchVendorCustomers.rejected, (state) => {
        state.customersLoading = false;
      });

    // Notifications
    builder.addCase(fetchVendorNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload;
      state.unreadNotificationsCount = action.payload.filter((n: any) => !n.isRead).length;
    });

    builder.addCase(markVendorNotificationRead.fulfilled, (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1);
      }
    });

    // COD Due Riders
    builder.addCase(fetchCodDueRiders.fulfilled, (state, action) => {
      state.codDueRiders = action.payload;
    });

    // Store Status
    builder.addCase(updateStoreStatus.fulfilled, (state, action) => {
      state.isStoreOpen = action.payload;
      if (state.vendorProfile) {
        state.vendorProfile.isStoreOpen = action.payload;
      }
    });

    // Delivery Radius
    builder.addCase(updateDeliveryRadius.fulfilled, (state, action) => {
      state.deliveryRadiusKm = action.payload;
      if (state.vendorProfile) {
        state.vendorProfile.deliveryRadiusKm = action.payload;
      }
    });
  },
});

export const { logoutVendor, clearVendorAlerts, setLocalStoreStatus, setLocalDeliveryRadius } =
  vendorSlice.actions;

export default vendorSlice.reducer;
