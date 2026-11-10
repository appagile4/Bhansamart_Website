import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ProductItem } from "@/components/ProductCard";

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface BackendCartItem {
  _id?: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  weight?: string;
  category?: string;
  subCategory?: string;
  isVeg?: boolean;
}

interface CartState {
  items: Record<string, CartItem>;
  totalCount: number;
  totalPrice: number;
  isCartOpen: boolean;
  syncLoading: boolean;
  error: string | null;
}

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("bhansa_token");
    } catch {}
  }
  return null;
};

const loadInitialCart = (): {
  items: Record<string, CartItem>;
  totalCount: number;
  totalPrice: number;
} => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bhansa_cart");
      if (stored) {
        const parsed = JSON.parse(stored);
        let count = 0;
        let price = 0;
        Object.values(parsed as Record<string, CartItem>).forEach((item) => {
          count += item.quantity;
          price += (item.product.price || 0) * item.quantity;
        });
        return {
          items: parsed,
          totalCount: count,
          totalPrice: price,
        };
      }
    } catch {}
  }
  return {
    items: {},
    totalCount: 0,
    totalPrice: 0,
  };
};

const saveCartToStorage = (items: Record<string, CartItem>) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bhansa_cart", JSON.stringify(items));
    } catch {}
  }
};

const initialState: CartState = {
  items: {},
  totalCount: 0,
  totalPrice: 0,
  isCartOpen: false,
  syncLoading: false,
  error: null,
};

const getProductImageUrl = (p: ProductItem): string => {
  return p.imageUrl || (p.images && p.images.length > 0 ? p.images[0].url : "");
};

// ── Async Thunks for Live Backend Synchronization ──

/**
 * Fetch authoritative user cart from backend API
 */
export const fetchBackendCart = createAsyncThunk(
  "cart/fetchBackendCart",
  async (_, { rejectWithValue }) => {
    const token = getAuthToken();
    if (!token) return rejectWithValue("Not logged in");

    try {
      const res = await fetch("/api/cart", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to load backend cart");
      }
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load backend cart"
      );
    }
  }
);

/**
 * Sync guest items to backend cart on login
 */
export const syncCartWithBackend = createAsyncThunk(
  "cart/syncCartWithBackend",
  async (_, { getState, rejectWithValue }) => {
    const token = getAuthToken();
    if (!token) return rejectWithValue("Not logged in");

    const state = getState() as { cart: CartState };
    const itemsToSync = Object.values(state.cart.items).map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice || item.product.price,
      quantity: item.quantity,
      imageUrl: getProductImageUrl(item.product),
      weight: item.product.unit || "1 unit",
      category: item.product.category || "",
      subCategory: item.product.subCategory || "",
    }));

    if (itemsToSync.length === 0) return null;

    try {
      const res = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsToSync }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to sync cart");
      }
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to sync cart"
      );
    }
  }
);

/**
 * Add product to cart with immediate optimistic local update & backend sync
 */
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (product: ProductItem, { dispatch }) => {
    // 1. Optimistic Local Update
    dispatch(cartSlice.actions.addToCartLocal(product));

    // 2. Background Backend Persistence
    const token = getAuthToken();
    if (token) {
      try {
        await fetch("/api/cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || product.price,
            quantity: 1,
            imageUrl: getProductImageUrl(product),
            weight: product.unit || "1 unit",
            category: product.category || "",
            subCategory: product.subCategory || "",
          }),
        });
      } catch (err) {
        console.warn("Could not sync addToCart to server in background:", err);
      }
    }
    return product;
  }
);

/**
 * Decrement or remove item from cart with optimistic local update & backend sync
 */
export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (productId: string, { dispatch }) => {
    // 1. Optimistic Local Update
    dispatch(cartSlice.actions.removeFromCartLocal(productId));

    // 2. Background Backend Persistence
    const token = getAuthToken();
    if (token) {
      try {
        await fetch("/api/cart/update-quantity", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            delta: -1,
          }),
        });
      } catch (err) {
        console.warn("Could not sync removeFromCart to server:", err);
      }
    }
    return productId;
  }
);

/**
 * Explicitly update item quantity
 */
export const updateQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (
    payload: { productId: string; quantity: number },
    { dispatch }
  ) => {
    dispatch(cartSlice.actions.updateQuantityLocal(payload));

    const token = getAuthToken();
    if (token) {
      try {
        await fetch("/api/cart/update-quantity", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Could not sync updateQuantity to server:", err);
      }
    }
    return payload;
  }
);

/**
 * Clear entire cart
 */
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { dispatch }) => {
    dispatch(cartSlice.actions.clearCartLocal());

    const token = getAuthToken();
    if (token) {
      try {
        await fetch("/api/cart", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn("Could not clear server cart:", err);
      }
    }
  }
);

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    initializeCart: (state) => {
      const loaded = loadInitialCart();
      state.items = loaded.items;
      state.totalCount = loaded.totalCount;
      state.totalPrice = loaded.totalPrice;
    },
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
    addToCartLocal: (state, action: PayloadAction<ProductItem>) => {
      const product = action.payload;
      const id = product._id;
      if (state.items[id]) {
        state.items[id].quantity += 1;
      } else {
        state.items[id] = { product, quantity: 1 };
      }

      state.totalCount += 1;
      state.totalPrice += product.price || 0;
      saveCartToStorage(state.items);
    },
    removeFromCartLocal: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.items[id]) {
        const productPrice = state.items[id].product.price || 0;
        if (state.items[id].quantity > 1) {
          state.items[id].quantity -= 1;
          state.totalCount -= 1;
          state.totalPrice = Math.max(0, state.totalPrice - productPrice);
        } else {
          state.totalCount -= 1;
          state.totalPrice = Math.max(0, state.totalPrice - productPrice);
          delete state.items[id];
        }
        saveCartToStorage(state.items);
      }
    },
    updateQuantityLocal: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;
      if (state.items[productId]) {
        if (quantity <= 0) {
          delete state.items[productId];
        } else {
          state.items[productId].quantity = quantity;
        }

        let count = 0;
        let price = 0;
        Object.values(state.items).forEach((item) => {
          count += item.quantity;
          price += (item.product.price || 0) * item.quantity;
        });
        state.totalCount = count;
        state.totalPrice = price;
        saveCartToStorage(state.items);
      }
    },
    clearCartLocal: (state) => {
      state.items = {};
      state.totalCount = 0;
      state.totalPrice = 0;
      saveCartToStorage({});
    },
  },
  extraReducers: (builder) => {
    // ── Backend Cart Hydration ──
    builder.addCase(fetchBackendCart.pending, (state) => {
      state.syncLoading = true;
    });
    builder.addCase(fetchBackendCart.fulfilled, (state, action) => {
      state.syncLoading = false;
      const backendData = action.payload;
      if (backendData && Array.isArray(backendData.items)) {
        // If backend has items, reconstruct Redux state
        const serverItems: Record<string, CartItem> = {};
        backendData.items.forEach((it: BackendCartItem) => {
          serverItems[it.productId] = {
            product: {
              _id: it.productId,
              name: it.name,
              price: it.price,
              originalPrice: it.originalPrice,
              unit: it.weight || "1 unit",
              imageUrl: it.imageUrl || "",
              category: it.category || "",
              subCategory: it.subCategory || "",
              inStock: true,
              stock: 99,
            },
            quantity: it.quantity,
          };
        });

        // Merge or adopt server cart if server has items
        if (backendData.items.length > 0) {
          state.items = serverItems;
          state.totalCount = backendData.totalCount || 0;
          state.totalPrice = backendData.totalPrice || 0;
          saveCartToStorage(serverItems);
        }
      }
    });
    builder.addCase(fetchBackendCart.rejected, (state, action) => {
      state.syncLoading = false;
      state.error = action.payload as string;
    });

    // ── Sync Guest Cart Fulfilled ──
    builder.addCase(syncCartWithBackend.fulfilled, (state, action) => {
      const backendData = action.payload;
      if (backendData && Array.isArray(backendData.items)) {
        const syncedItems: Record<string, CartItem> = {};
        backendData.items.forEach((it: BackendCartItem) => {
          syncedItems[it.productId] = {
            product: {
              _id: it.productId,
              name: it.name,
              price: it.price,
              originalPrice: it.originalPrice,
              unit: it.weight || "1 unit",
              imageUrl: it.imageUrl || "",
              category: it.category || "",
              subCategory: it.subCategory || "",
              inStock: true,
              stock: 99,
            },
            quantity: it.quantity,
          };
        });
        state.items = syncedItems;
        state.totalCount = backendData.totalCount || 0;
        state.totalPrice = backendData.totalPrice || 0;
        saveCartToStorage(syncedItems);
      }
    });
  },
});

export const {
  initializeCart,
  openCart,
  closeCart,
  toggleCart,
  addToCartLocal,
  removeFromCartLocal,
  updateQuantityLocal,
  clearCartLocal,
} = cartSlice.actions;

export default cartSlice.reducer;
