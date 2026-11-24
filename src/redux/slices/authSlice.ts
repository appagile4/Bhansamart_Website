import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
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
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error logging in"
      );
    }
  }
);

// Async thunk for Google Sign-In (sign in or sign up with a Google ID token)
export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (payload: { idToken: string; referralCode?: string }, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Google sign-in failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data as { user: UserProfile; token: string; isNewUser?: boolean };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error during Google sign-in"
      );
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
      phone?: string;
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
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error during registration"
      );
    }
  }
);

// ── Customer Auth Thunks ──────────────────────────────────────────────

// Check customer email existence & available login options
export const checkCustomerEmail = createAsyncThunk(
  "auth/checkCustomerEmail",
  async (email: string, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/customer/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Unable to check email");
      }
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error checking email"
      );
    }
  }
);

// Send OTP to customer email
export const sendCustomerOtp = createAsyncThunk(
  "auth/sendCustomerOtp",
  async (
    { email, purpose }: { email: string; purpose?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to send verification code");
      }
      return data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error sending OTP"
      );
    }
  }
);

// Verify OTP (Direct login for existing customer, registration token for new)
export const verifyCustomerOtp = createAsyncThunk(
  "auth/verifyCustomerOtp",
  async (
    { email, otp, purpose }: { email: string; otp: string; purpose?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, purpose }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Invalid verification code");
      }

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error verifying OTP"
      );
    }
  }
);

// Complete customer registration (mandatory password setup)
export const completeCustomerRegistration = createAsyncThunk(
  "auth/completeCustomerRegistration",
  async (
    payload: {
      registrationToken: string;
      password: string;
      confirmPassword?: string;
      name?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("/api/customer/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to complete registration");
      }

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error completing registration"
      );
    }
  }
);

// Customer Password Login
export const loginCustomerPassword = createAsyncThunk(
  "auth/loginCustomerPassword",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to log in");
      }

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error logging in"
      );
    }
  }
);

// Customer Google Login
export const loginCustomerGoogle = createAsyncThunk(
  "auth/loginCustomerGoogle",
  async (idToken: string, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/customer/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Google authentication failed");
      }

      if (data.data?.token && typeof window !== "undefined") {
        localStorage.setItem("bhansa_token", data.data.token);
        localStorage.setItem("bhansa_user", JSON.stringify(data.data.user));
      }

      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error during Google login"
      );
    }
  }
);

// Async thunk for fetching current profile with token
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;
      if (!token) return rejectWithValue("No token saved");

      const res = await fetch("/api/auth/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bhansa_token");
          localStorage.removeItem("bhansa_user");
        }
        return rejectWithValue("Session expired. Please log in again.");
      }

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || "Failed to load user profile");
      }

      const realUser: UserProfile = data.data?.user || data.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_user", JSON.stringify(realUser));
      }

      return { user: realUser, token };
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Failed to load user profile"
      );
    }
  }
);

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (
    profileData: {
      name?: string;
      gender?: string;
      dateOfBirth?: string;
      dob?: string;
      address?: string;
      phone?: string;
      avatar?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.token ||
        (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null);
      if (!token) return rejectWithValue("Authentication required. Please login.");

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(
          data.message || data.errors?.[0] || "Failed to update profile"
        );
      }

      // Merge updated fields
      const updatedUser: UserProfile = {
        ...(state.auth.user || ({} as UserProfile)),
        ...(data.data?.user || {}),
        ...(profileData.phone ? { phone: profileData.phone } : {}),
        ...(profileData.avatar ? { avatar: profileData.avatar } : {}),
        ...(profileData.name ? { name: profileData.name } : {}),
        ...(profileData.gender ? { gender: profileData.gender } : {}),
        ...(profileData.dateOfBirth ? { dateOfBirth: profileData.dateOfBirth } : {}),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_user", JSON.stringify(updatedUser));
      }

      return updatedUser;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error updating profile"
      );
    }
  }
);

// Async thunk to add a mobile number once (backend only allows it while the phone is empty)
export const addPhoneNumber = createAsyncThunk(
  "auth/addPhoneNumber",
  async (phone: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.token ||
        (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null);
      if (!token) return rejectWithValue("Authentication required. Please login.");

      const res = await fetch("/api/auth/profile/phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(data.message || data.errors?.[0] || "Failed to save mobile number");
      }

      const savedPhone: string = data.data?.user?.phone || phone;
      const updatedUser: UserProfile = {
        ...(state.auth.user || ({} as UserProfile)),
        phone: savedPhone,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("bhansa_user", JSON.stringify(updatedUser));
      }
      return updatedUser;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error saving mobile number"
      );
    }
  }
);

// Async thunk for changing account password
export const changeUserPassword = createAsyncThunk(
  "auth/changePassword",
  async (
    payload: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const token =
        state.auth.token ||
        (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null);
      if (!token) return rejectWithValue("Authentication required. Please login.");

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return rejectWithValue(
          data.message || data.errors?.[0] || "Failed to change password"
        );
      }

      return data.message || "Password changed successfully";
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : "Network error changing password"
      );
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
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          if (userStr) {
            try {
              state.user = JSON.parse(userStr);
            } catch {
              localStorage.removeItem("bhansa_user");
            }
          }
        }
      }
    },
    updateLocalUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== "undefined") {
          localStorage.setItem("bhansa_user", JSON.stringify(state.user));
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

    // Google Sign-In
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = action.payload.isNewUser
          ? "Account created with Google"
          : "Logged in successfully";
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Google sign-in failed";
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

    // Customer Auth: Password Login
    builder
      .addCase(loginCustomerPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCustomerPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = "Logged in successfully";
      })
      .addCase(loginCustomerPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // Customer Auth: Verify OTP
    builder
      .addCase(verifyCustomerOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyCustomerOtp.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data?.token) {
          state.user = action.payload.data.user;
          state.token = action.payload.data.token;
          state.isAuthenticated = true;
          state.successMessage = "Logged in successfully";
        }
      })
      .addCase(verifyCustomerOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Verification failed";
      });

    // Customer Auth: Complete Registration
    builder
      .addCase(completeCustomerRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeCustomerRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = "Account registered successfully";
      })
      .addCase(completeCustomerRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Registration failed";
      });

    // Customer Auth: Google Login
    builder
      .addCase(loginCustomerGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCustomerGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.successMessage = "Signed in with Google successfully";
      })
      .addCase(loginCustomerGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Google authentication failed";
      });

    // Fetch Profile
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        if (action.payload === "Session expired. Please log in again.") {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = "Profile updated successfully";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update profile";
      });

    // Add phone (one-time). Errors are shown by the profile page itself, so no global error here.
    builder.addCase(addPhoneNumber.fulfilled, (state, action) => {
      state.user = action.payload;
    });

    // Change Password
    builder
      .addCase(changeUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changeUserPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = (action.payload as string) || "Password changed successfully";
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to change password";
      });
  },
});

export const { initializeAuth, logout, clearAuthError, updateLocalUser } = authSlice.actions;
export default authSlice.reducer;
