import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  rewardPoints?: number;
  referralCode?: string;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  successMessage: null,
};

// Async thunk for logging in
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to log in");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error logging in");
    }
  }
);

// Async thunk for registering
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
      dateOfBirth: string;
      gender: string;
      address?: string;
      referralCode?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || data.errors?.[0]?.message || "Registration failed");
      }

      if (typeof window !== "undefined" && data.data?.token) {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.message || "Network error during registration");
    }
  }
);

// Async thunk for fetching current profile with token
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;
      if (!token) return rejectWithValue("No token saved");

      const res = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bhansa_token");
          localStorage.removeItem("bhansa_user");
        }
        return rejectWithValue(data.message || "Session expired");
      }

      return { user: data.data, token };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to load user profile");
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    initializeAuth: (state) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("bhansa_token");
        const userStr = localStorage.getItem("bhansa_user");
        if (token && userStr) {
          try {
            state.token = token;
            state.user = JSON.parse(userStr);
            state.isAuthenticated = true;
          } catch {
            localStorage.removeItem("bhansa_token");
            localStorage.removeItem("bhansa_user");
          }
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("bhansa_token");
        localStorage.removeItem("bhansa_user");
      }
    },
    clearAuthError: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = "Logged in successfully";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = "Account registered successfully";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Registration failed";
      });

    // Fetch Profile
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { initializeAuth, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
