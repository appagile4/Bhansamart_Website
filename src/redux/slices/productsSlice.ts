import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ProductItem } from "@/components/ProductCard";

interface ProductsState {
  items: ProductItem[];
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  selectedSubCategory: string;
  searchQuery: string;
  eligibleVendorsCount: number;
  isOutsideDeliveryZone: boolean;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
  selectedCategory: "all",
  selectedSubCategory: "all",
  searchQuery: "",
  eligibleVendorsCount: 4,
  isOutsideDeliveryZone: false,
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (
    params: {
      lat?: number;
      lng?: number;
      city?: string;
      category?: string;
      subCategory?: string;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const query = new URLSearchParams();
      if (params.lat != null) query.set("lat", String(params.lat));
      if (params.lng != null) query.set("lng", String(params.lng));
      if (params.city) query.set("city", params.city);
      if (params.category && params.category !== "all" && params.category !== "All") {
        query.set("category", params.category);
      }
      if (params.subCategory && params.subCategory !== "all" && params.subCategory !== "All") {
        query.set("subCategory", params.subCategory);
      }
      if (params.search) query.set("search", params.search);
      query.set("limit", "100");

      const res = await fetch(`/api/products?${query.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to load products");
      }

      return {
        products: (data.products || []) as ProductItem[],
        eligibleVendorsCount: data.eligibleVendorsCount ?? 0,
        isOutsideDeliveryZone: Boolean(
          data.isOutsideDeliveryZone && (data.products || []).length === 0
        ),
      };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error loading products"
      );
    }
  }
);

export const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.selectedSubCategory = "all";
    },
    setSelectedSubCategory: (state, action: PayloadAction<string>) => {
      state.selectedSubCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    resetFilters: (state) => {
      state.selectedCategory = "all";
      state.selectedSubCategory = "all";
      state.searchQuery = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.eligibleVendorsCount = action.payload.eligibleVendorsCount;
        state.isOutsideDeliveryZone = action.payload.isOutsideDeliveryZone;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch products";
      });
  },
});

export const {
  setSelectedCategory,
  setSelectedSubCategory,
  setSearchQuery,
  resetFilters,
} = productsSlice.actions;

export default productsSlice.reducer;
