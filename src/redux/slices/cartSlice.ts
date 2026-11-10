import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ProductItem } from "@/components/ProductCard";

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface CartState {
  items: Record<string, CartItem>;
  totalCount: number;
  totalPrice: number;
  isCartOpen: boolean;
}

const loadInitialCart = (): { items: Record<string, CartItem>; totalCount: number; totalPrice: number } => {
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
};

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
    addToCart: (state, action: PayloadAction<ProductItem>) => {
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
    removeFromCart: (state, action: PayloadAction<string>) => {
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
    updateQuantity: (
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

        // Recalculate
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
    clearCart: (state) => {
      state.items = {};
      state.totalCount = 0;
      state.totalPrice = 0;
      saveCartToStorage({});
    },
  },
});

export const {
  initializeCart,
  openCart,
  closeCart,
  toggleCart,
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
