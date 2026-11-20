import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as sellerApi from "@/lib/seller/api";
import type {
  CodSummary,
  SellerNotification,
  SellerOrder,
  SellerStats,
} from "@/lib/seller/types";

// ─── Session types ───────────────────────────────────────────────────────

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
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    panNumber?: string;
    yearEstablished?: number | null;
    numberOfEmployees?: number | null;
    retailChannel?: string;
    categories?: string[];
    businessPhone?: string;
    businessEmail?: string;
  };
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    branch?: string;
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
    brandType?: string;
    trademarkNumber?: string;
    brandWebsite?: string;
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
  wallet?: {
    currentBalance?: number;
    totalEarned?: number;
    pendingSettlement?: number;
    codCashWithDeliveryBoys?: number;
    pendingRecoveries?: number;
  };
  deliveryRadiusKm?: number;
  isStoreOpen?: boolean;
  status?: string;
  adminRemark?: string;
}

export interface VendorSessionResponse {
  success: boolean;
  message?: string;
  token: string;
  user: VendorUser;
  vendor: VendorProfile;
}

export type VendorSectionName =
  | "businessDetails"
  | "sellerDetails"
  | "brandDetails"
  | "bankDetails"
  | "shippingLocations";

export interface VendorRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  storeName?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// ─── State ───────────────────────────────────────────────────────────────

export interface VendorState {
  vendorToken: string | null;
  vendorUser: VendorUser | null;
  vendorProfile: VendorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  stats: SellerStats | null;
  statsLoading: boolean;

  /** Recent store orders (backend caps at 100) — shared by dashboard, orders & delivery pages */
  orders: SellerOrder[];
  ordersLoading: boolean;
  ordersLoaded: boolean;
  pendingCount: number;

  notifications: SellerNotification[];
  unreadNotificationsCount: number;

  codSummary: CodSummary | null;

  isStoreOpen: boolean;
  deliveryRadiusKm: number;

  /** Incoming order shown in the "New Order" popup (app: newOrderAlert) */
  newOrderAlert: SellerOrder | null;
  liveConnected: boolean;
}

export const vendorInitialState: VendorState = {
  vendorToken: null,
  vendorUser: null,
  vendorProfile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  successMessage: null,

  stats: null,
  statsLoading: false,

  orders: [],
  ordersLoading: false,
  ordersLoaded: false,
  pendingCount: 0,

  notifications: [],
  unreadNotificationsCount: 0,

  codSummary: null,

  isStoreOpen: true,
  deliveryRadiusKm: 5,

  newOrderAlert: null,
  liveConnected: false,
};

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const persist = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const persistVendorSession = (data: VendorSessionResponse) => {
  if (!data?.token) return;
  persist("bhansa_vendor_token", data.token);
  if (data.user) persist("bhansa_vendor_user", data.user);
  if (data.vendor) persist("bhansa_vendor_profile", data.vendor);
};

async function postAuth<T>(path: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(`/api/auth/vendor/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || fallback);
  return data as T;
}

// ─── Session thunks ──────────────────────────────────────────────────────

export const loginVendorPassword = createAsyncThunk(
  "vendor/loginPassword",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await postAuth<VendorSessionResponse>("login", credentials, "Vendor login failed.");
      persistVendorSession(data);
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Network error during vendor login."));
    }
  }
);

export const registerVendor = createAsyncThunk(
  "vendor/register",
  async (payload: VendorRegisterPayload, { rejectWithValue }) => {
    try {
      const data = await postAuth<VendorSessionResponse>("register", payload, "Vendor registration failed.");
      persistVendorSession(data);
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Network error during vendor registration."));
    }
  }
);

export const sendVendorOtp = createAsyncThunk("vendor/sendOtp", async (email: string, { rejectWithValue }) => {
  try {
    const data = await postAuth<{ message?: string }>("send-otp", { email }, "Could not send OTP.");
    return data.message || "OTP sent to your email.";
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Network error while sending OTP."));
  }
});

export const verifyVendorOtp = createAsyncThunk(
  "vendor/verifyOtp",
  async (payload: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await postAuth<VendorSessionResponse>("verify-otp", payload, "OTP verification failed.");
      persistVendorSession(data);
      return data;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Network error while verifying OTP."));
    }
  }
);

export const fetchMyVendorProfile = createAsyncThunk(
  "vendor/fetchMyProfile",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const data = await sellerApi.sellerRequest<{ user?: VendorUser; vendor?: VendorProfile }>("/auth/vendor/me");
      if (data.user) persist("bhansa_vendor_user", data.user);
      if (data.vendor) persist("bhansa_vendor_profile", data.vendor);
      return data;
    } catch (err) {
      // Expired / revoked session → clear it so the guard sends the seller back to login
      if (err instanceof sellerApi.SellerApiError && (err.status === 401 || err.status === 403)) {
        dispatch(vendorSlice.actions.logoutVendor());
      }
      return rejectWithValue(errorMessage(err, "Could not fetch vendor profile."));
    }
  }
);

export const saveVendorSection = createAsyncThunk(
  "vendor/saveSection",
  async (payload: { section: VendorSectionName; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const r = await sellerApi.sellerRequest<{ data: VendorProfile }>("/vendor/update-section", {
        method: "PUT",
        json: payload,
      });
      if (r.data) persist("bhansa_vendor_profile", r.data);
      return r.data;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Could not save details."));
    }
  }
);

export const uploadVendorLogo = createAsyncThunk("vendor/uploadLogo", async (file: File, { rejectWithValue }) => {
  try {
    const form = new FormData();
    form.append("logo", file);
    const r = await sellerApi.sellerRequest<{ data: VendorProfile }>("/vendor/upload-logo", { method: "POST", form });
    if (r.data) persist("bhansa_vendor_profile", r.data);
    return r.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Logo upload failed."));
  }
});

// ─── Shared live data thunks ─────────────────────────────────────────────

export const fetchVendorStats = createAsyncThunk("vendor/fetchStats", async (_, { rejectWithValue }) => {
  try {
    return await sellerApi.getDashboardStats();
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Failed to load dashboard metrics."));
  }
});

export const fetchVendorOrders = createAsyncThunk("vendor/fetchOrders", async (_, { rejectWithValue }) => {
  try {
    return await sellerApi.getVendorOrders({ status: "all", limit: 100 });
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Failed to load orders."));
  }
});

export const changeOrderStatus = createAsyncThunk(
  "vendor/changeOrderStatus",
  async (payload: { orderId: string; status: string; reason?: string }, { rejectWithValue }) => {
    try {
      const order = await sellerApi.updateOrderStatus(payload.orderId, payload.status, payload.reason);
      return { orderId: payload.orderId, status: payload.status, order };
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Could not update order status."));
    }
  }
);

export const fetchVendorNotifications = createAsyncThunk("vendor/fetchNotifications", async (_, { rejectWithValue }) => {
  try {
    return await sellerApi.getNotifications({ limit: 100 });
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Failed to load notifications."));
  }
});

export const markVendorNotificationRead = createAsyncThunk(
  "vendor/markNotificationRead",
  async (id: string, { rejectWithValue }) => {
    try {
      await sellerApi.markNotificationRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Could not mark notification as read."));
    }
  }
);

export const markAllVendorNotificationsRead = createAsyncThunk(
  "vendor/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      await sellerApi.markAllNotificationsRead();
      return true;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Could not mark notifications as read."));
    }
  }
);

export const fetchCodSummary = createAsyncThunk("vendor/fetchCodSummary", async (_, { rejectWithValue }) => {
  try {
    return await sellerApi.getCodSummary();
  } catch (err) {
    return rejectWithValue(errorMessage(err, "Failed to load COD summary."));
  }
});

export const updateStoreStatus = createAsyncThunk(
  "vendor/updateStoreStatus",
  async (isStoreOpen: boolean, { rejectWithValue }) => {
    try {
      await sellerApi.setStoreOpen(isStoreOpen);
      return isStoreOpen;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Failed to update store status."));
    }
  }
);

export const updateDeliveryRadius = createAsyncThunk(
  "vendor/updateDeliveryRadius",
  async (radiusKm: number, { rejectWithValue }) => {
    try {
      await sellerApi.setDeliveryRadius(radiusKm);
      return radiusKm;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Failed to update delivery radius."));
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────

const mergeOrder = (orders: SellerOrder[], patch: Partial<SellerOrder> & { _id: string }) => {
  const idx = orders.findIndex(
    (o) => o._id === patch._id || (patch.orderNumber && o.orderNumber === patch.orderNumber)
  );
  if (idx === -1) return false;
  orders[idx] = { ...orders[idx], ...patch } as SellerOrder;
  return true;
};

const countPending = (orders: SellerOrder[]) => orders.filter((o) => o.orderStatus === "PLACED").length;

export const vendorSlice = createSlice({
  name: "vendor",
  initialState: vendorInitialState,
  reducers: {
    initializeVendor: (state) => {
      if (typeof window === "undefined") return;
      try {
        const token = localStorage.getItem("bhansa_vendor_token") || localStorage.getItem("vendor_token");
        if (!token) return;
        state.vendorToken = token;
        state.isAuthenticated = true;
        const userStr = localStorage.getItem("bhansa_vendor_user");
        const profileStr = localStorage.getItem("bhansa_vendor_profile");
        if (userStr) state.vendorUser = JSON.parse(userStr);
        if (profileStr) {
          const p = JSON.parse(profileStr) as VendorProfile;
          state.vendorProfile = p;
          state.isStoreOpen = p.isStoreOpen ?? true;
          state.deliveryRadiusKm = p.deliveryRadiusKm ?? 5;
        }
      } catch {
        /* corrupt cache — ignore */
      }
    },
    logoutVendor: () => {
      if (typeof window !== "undefined") {
        try {
          ["bhansa_vendor_token", "bhansa_vendor_user", "bhansa_vendor_profile", "vendor_token"].forEach((k) =>
            localStorage.removeItem(k)
          );
        } catch {
          /* ignore */
        }
      }
      return vendorInitialState;
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
    /** socket: vendor:order:new */
    orderReceived: (state, action: PayloadAction<SellerOrder>) => {
      const order = action.payload;
      if (!order?._id) return;
      if (!mergeOrder(state.orders, order)) state.orders.unshift(order);
      state.pendingCount = countPending(state.orders);
      state.newOrderAlert = order;
    },
    /** socket: vendor:order:status_updated */
    orderPatched: (state, action: PayloadAction<Partial<SellerOrder> & { _id: string }>) => {
      mergeOrder(state.orders, action.payload);
      if (
        state.newOrderAlert &&
        state.newOrderAlert._id === action.payload._id &&
        action.payload.orderStatus &&
        action.payload.orderStatus !== "PLACED"
      ) {
        state.newOrderAlert = null;
      }
      state.pendingCount = countPending(state.orders);
    },
    dismissNewOrderAlert: (state) => {
      state.newOrderAlert = null;
    },
    setLiveConnected: (state, action: PayloadAction<boolean>) => {
      state.liveConnected = action.payload;
    },
    notificationReceived: (state, action: PayloadAction<SellerNotification>) => {
      const n = action.payload;
      if (n?._id && !state.notifications.some((x) => x._id === n._id)) state.notifications.unshift(n);
      state.unreadNotificationsCount += 1;
    },
  },
  extraReducers: (builder) => {
    // Session
    const applySession = (state: VendorState, payload: VendorSessionResponse, message: string) => {
      state.isLoading = false;
      state.vendorToken = payload.token;
      state.vendorUser = payload.user;
      state.vendorProfile = payload.vendor;
      state.isAuthenticated = true;
      state.isStoreOpen = payload.vendor?.isStoreOpen ?? true;
      state.deliveryRadiusKm = payload.vendor?.deliveryRadiusKm ?? 5;
      state.successMessage = message;
    };
    const setPending = (state: VendorState) => {
      state.isLoading = true;
      state.error = null;
      state.successMessage = null;
    };
    const setRejected = (fallback: string) => (state: VendorState, action: { payload?: unknown }) => {
      state.isLoading = false;
      state.error = (action.payload as string) || fallback;
    };

    builder
      .addCase(loginVendorPassword.pending, setPending)
      .addCase(loginVendorPassword.fulfilled, (s, a) => applySession(s, a.payload, "Vendor logged in successfully."))
      .addCase(loginVendorPassword.rejected, setRejected("Vendor login failed."))
      .addCase(registerVendor.pending, setPending)
      .addCase(registerVendor.fulfilled, (s, a) => applySession(s, a.payload, "Seller account created successfully."))
      .addCase(registerVendor.rejected, setRejected("Vendor registration failed."))
      .addCase(sendVendorOtp.pending, setPending)
      .addCase(sendVendorOtp.fulfilled, (s, a) => {
        s.isLoading = false;
        s.successMessage = a.payload;
      })
      .addCase(sendVendorOtp.rejected, setRejected("Could not send OTP."))
      .addCase(verifyVendorOtp.pending, setPending)
      .addCase(verifyVendorOtp.fulfilled, (s, a) => applySession(s, a.payload, "Vendor logged in successfully."))
      .addCase(verifyVendorOtp.rejected, setRejected("OTP verification failed."));

    const applyProfile = (state: VendorState, profile?: VendorProfile) => {
      if (!profile) return;
      state.vendorProfile = profile;
      state.isStoreOpen = profile.isStoreOpen ?? state.isStoreOpen;
      state.deliveryRadiusKm = profile.deliveryRadiusKm ?? state.deliveryRadiusKm;
    };
    builder
      .addCase(fetchMyVendorProfile.fulfilled, (s, a) => {
        if (a.payload.user) s.vendorUser = a.payload.user;
        applyProfile(s, a.payload.vendor);
      })
      .addCase(saveVendorSection.fulfilled, (s, a) => applyProfile(s, a.payload))
      .addCase(uploadVendorLogo.fulfilled, (s, a) => applyProfile(s, a.payload));

    // Stats
    builder
      .addCase(fetchVendorStats.pending, (s) => {
        s.statsLoading = true;
      })
      .addCase(fetchVendorStats.fulfilled, (s, a) => {
        s.statsLoading = false;
        s.stats = a.payload;
        s.isStoreOpen = a.payload.isStoreOpen;
        s.deliveryRadiusKm = a.payload.deliveryRadiusKm;
        s.unreadNotificationsCount = a.payload.unreadNotificationsCount ?? s.unreadNotificationsCount;
      })
      .addCase(fetchVendorStats.rejected, (s) => {
        s.statsLoading = false;
      });

    // Orders
    builder
      .addCase(fetchVendorOrders.pending, (s) => {
        s.ordersLoading = true;
      })
      .addCase(fetchVendorOrders.fulfilled, (s, a) => {
        s.ordersLoading = false;
        s.ordersLoaded = true;
        s.orders = a.payload.data;
        s.pendingCount = a.payload.pendingCount;
      })
      .addCase(fetchVendorOrders.rejected, (s) => {
        s.ordersLoading = false;
        s.ordersLoaded = true;
      })
      .addCase(changeOrderStatus.fulfilled, (s, a) => {
        const existing = s.orders.find((o) => o._id === a.payload.orderId);
        const fromServer = a.payload.order;
        mergeOrder(s.orders, {
          ...(fromServer || {}),
          _id: a.payload.orderId,
          orderStatus: (fromServer?.orderStatus || a.payload.status) as SellerOrder["orderStatus"],
          // the status response is not populated — keep the list copy's customer / rider
          customer: existing?.customer ?? fromServer?.customer,
          assignedDeliveryBoy: existing?.assignedDeliveryBoy ?? fromServer?.assignedDeliveryBoy,
        });
        s.pendingCount = countPending(s.orders);
        if (s.newOrderAlert?._id === a.payload.orderId) s.newOrderAlert = null;
      });

    // Notifications
    builder
      .addCase(fetchVendorNotifications.fulfilled, (s, a) => {
        s.notifications = a.payload.notifications;
        s.unreadNotificationsCount = a.payload.unreadCount;
      })
      .addCase(markVendorNotificationRead.fulfilled, (s, a) => {
        const n = s.notifications.find((x) => x._id === a.payload);
        if (n && !n.isRead) {
          n.isRead = true;
          s.unreadNotificationsCount = Math.max(0, s.unreadNotificationsCount - 1);
        }
      })
      .addCase(markAllVendorNotificationsRead.fulfilled, (s) => {
        s.notifications.forEach((n) => {
          n.isRead = true;
        });
        s.unreadNotificationsCount = 0;
      });

    // COD
    builder.addCase(fetchCodSummary.fulfilled, (s, a) => {
      s.codSummary = a.payload;
    });

    // Store controls
    builder
      .addCase(updateStoreStatus.fulfilled, (s, a) => {
        s.isStoreOpen = a.payload;
        if (s.vendorProfile) s.vendorProfile.isStoreOpen = a.payload;
        if (s.stats) s.stats.isStoreOpen = a.payload;
      })
      .addCase(updateDeliveryRadius.fulfilled, (s, a) => {
        s.deliveryRadiusKm = a.payload;
        if (s.vendorProfile) s.vendorProfile.deliveryRadiusKm = a.payload;
        if (s.stats) s.stats.deliveryRadiusKm = a.payload;
      });
  },
});

export const {
  initializeVendor,
  logoutVendor,
  clearVendorAlerts,
  setLocalStoreStatus,
  setLocalDeliveryRadius,
  orderReceived,
  orderPatched,
  dismissNewOrderAlert,
  setLiveConnected,
  notificationReceived,
} = vendorSlice.actions;

export default vendorSlice.reducer;
