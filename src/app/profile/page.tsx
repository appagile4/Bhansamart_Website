"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import AddressModal from "@/components/AddressModal";
import Footer from "@/components/Footer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  logout,
  updateProfile,
  changeUserPassword,
  fetchCurrentUser,
  updateLocalUser,
  UserProfile,
} from "@/redux/slices/authSlice";
import { setAddress } from "@/redux/slices/addressSlice";
import { addToCart, openCart } from "@/redux/slices/cartSlice";
import {
  User,
  ShoppingBag,
  BookOpen,
  Star,
  CreditCard,
  Share2,
  HelpCircle,
  Info,
  LogOut,
  Plus,
  Home as HomeIcon,
  Phone,
  MoreHorizontal,
  X,
  Check,
  MapPin,
  Calendar,
  Lock,
  Camera,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  AlertCircle,
  Loader2,
  KeyRound,
  Heart,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Truck,
  Clock,
  XCircle,
  Ban,
} from "lucide-react";

interface SavedAddress {
  _id?: string;
  type: string;
  addressLine: string;
  houseNo?: string;
  landmark?: string;
  city?: string;
  phone: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

interface OrderItem {
  _id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  unit?: string;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  reason?: string;
  updatedBy?: string;
}

interface UserOrder {
  _id: string;
  orderNumber?: string;
  orderStatus: string;
  items: OrderItem[];
  itemsTotal?: number;
  handlingCharge?: number;
  deliveryCharge?: number;
  discount?: number;
  totalAmount?: number;
  pricing?: {
    grandTotal?: number;
    itemsTotal?: number;
    deliveryFee?: number;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryAddress?: {
    addressLine?: string;
    city?: string;
    street?: string;
    houseNo?: string;
    landmark?: string;
    phone?: string;
    type?: string;
    latitude?: number;
    longitude?: number;
  };
  statusHistory?: StatusHistoryItem[];
  estimatedDeliveryTime?: string;
  createdAt: string;
}

interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageUrl?: string;
  weight?: string;
  category?: string;
}

interface UserReview {
  _id: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedBuyer: boolean;
}

const ORDER_TRACKING_STEPS = [
  { key: "PLACED", label: "Order Placed", desc: "Received at hub" },
  { key: "ACCEPTED", label: "Store Accepted", desc: "Items verified" },
  { key: "PREPARING", label: "Packing", desc: "Packed & verified" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Rider on the way" },
  { key: "DELIVERED", label: "Delivered", desc: "At your doorstep" },
];

const getActiveOrderStep = (status: string): number => {
  const s = (status || "").toUpperCase();
  if (s === "DELIVERED") return 4;
  if (s === "OUT_FOR_DELIVERY") return 3;
  if (s === "PREPARING" || s === "READY_FOR_PICKUP") return 2;
  if (s === "ACCEPTED") return 1;
  return 0; // PLACED
};

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
];

// Subcomponent for Profile details & Password with key-based state initialization
function ProfileTabContent({
  user,
  onRefresh,
}: {
  user: UserProfile | null;
  onRefresh: () => void;
}) {
  const dispatch = useAppDispatch();

  // ── Profile Form State (Initialized with real user data) ──
  const [fullName, setFullName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "customer@bhansamart.com");
  const [gender, setGender] = useState(user?.gender || "Other");
  // Mobile number: permanently non-changeable as per requirements
  const phone = user?.phone || "9868686868";
  const [dob, setDob] = useState(() => {
    if (user?.dateOfBirth) {
      try {
        return new Date(user.dateOfBirth).toISOString().split("T")[0];
      } catch {
        return "";
      }
    }
    return "";
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || PRESET_AVATARS[0]);
  const [addressLine, setAddressLine] = useState(user?.address || "");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // ── Password Change State ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // ── Avatar Picker Modal ──
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState("");

  // ── Email Change with OTP Verification State ──
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [emailStep, setEmailStep] = useState<"enter-email" | "enter-otp">("enter-email");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpSuccess, setEmailOtpSuccess] = useState<string | null>(null);
  const [otpPreviewCode, setOtpPreviewCode] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // ── Handle Send OTP for Email Change ──
  const handleSendEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailOtpError(null);
    setEmailOtpSuccess(null);

    const targetEmail = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      setEmailOtpError("Please enter a valid email address.");
      return;
    }
    if (targetEmail === email.toLowerCase().trim()) {
      setEmailOtpError("The new email cannot be the same as your current email.");
      return;
    }

    const activeToken =
      typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;
    if (!activeToken) {
      setEmailOtpError("Please log in to change your email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/email/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ newEmail: targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailOtpSuccess(data.message || `Verification code sent to ${targetEmail}`);
        if (data.otpPreview) {
          setOtpPreviewCode(data.otpPreview);
        }
        setEmailStep("enter-otp");
        setOtpCountdown(60);
      } else {
        setEmailOtpError(data.message || "Failed to send verification code. Please try again.");
      }
    } catch {
      setEmailOtpError("Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Handle Verify OTP & Update Email ──
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    setEmailOtpSuccess(null);

    if (!otpInput || otpInput.trim().length < 4) {
      setEmailOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    const activeToken =
      typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;
    if (!activeToken) {
      setEmailOtpError("Please log in to continue.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          newEmail: newEmailInput.trim().toLowerCase(),
          otp: otpInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const verifiedEmail = newEmailInput.trim().toLowerCase();
        setEmail(verifiedEmail);
        dispatch(updateLocalUser({ email: verifiedEmail, isEmailVerified: true }));
        setProfileSuccessMsg(`Email address successfully updated and verified to ${verifiedEmail}!`);
        setEmailOtpSuccess("Email verified successfully!");
        setTimeout(() => {
          setIsChangeEmailOpen(false);
          onRefresh();
        }, 1200);
      } else {
        setEmailOtpError(data.message || "Invalid or expired verification code.");
      }
    } catch {
      setEmailOtpError("Network error verifying code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Handle Save Profile Changes ──
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg("Full name is required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const resultAction = await dispatch(
        updateProfile({
          name: fullName.trim(),
          gender,
          dateOfBirth: dob || undefined,
          address: addressLine.trim() || undefined,
          avatar: avatarUrl,
        })
      );

      if (updateProfile.fulfilled.match(resultAction)) {
        setProfileSuccessMsg("Profile information updated successfully!");
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(
          (resultAction.payload as string) || "Failed to update profile. Please try again."
        );
      }
    } catch (err: unknown) {
      setProfileErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Handle Change Password ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Confirm password does not match new password.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const resultAction = await dispatch(
        changeUserPassword({
          currentPassword,
          newPassword,
          confirmPassword,
        })
      );

      if (changeUserPassword.fulfilled.match(resultAction)) {
        setPasswordSuccessMsg("Account password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccessMsg(null), 5000);
      } else {
        setPasswordErrorMsg(
          (resultAction.payload as string) ||
            "Failed to change password. Please verify your current password."
        );
      }
    } catch (err: unknown) {
      setPasswordErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          My Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account credentials and personal preferences
        </p>
      </div>

      {/* ── 1. Profile Picture / Avatar Card (profile) ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 bg-gradient-to-r from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200/80">
        <div className="relative group shrink-0">
          <img
            src={avatarUrl}
            alt={fullName || "User Avatar"}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-md"
            onError={() => {
              setAvatarUrl(PRESET_AVATARS[0]);
            }}
          />
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            className="absolute bottom-0 right-0 p-2 bg-[#0B4D58] hover:bg-[#083a42] text-white rounded-full shadow-md transition transform group-hover:scale-105 cursor-pointer"
            title="Change Profile Picture"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {fullName || "Customer Account"}
            </h3>
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              {user?.role || "CUSTOMER"}
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{email}</span>
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-xs font-bold text-[#0B4D58] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Change Profile Picture
            </button>
            {user?.rewardPoints !== undefined && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200">
                🎁 {user.rewardPoints} Reward Points
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {profileSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {profileErrorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      {/* ── 2. Personal Information Form ── */}
      <form onSubmit={handleSaveProfile} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Full Name (name) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
            </div>
          </div>

          {/* Email Address (email - changeable with OTP verification) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Verified
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput("");
                    setOtpInput("");
                    setEmailStep("enter-email");
                    setEmailOtpError(null);
                    setEmailOtpSuccess(null);
                    setOtpPreviewCode(null);
                    setIsChangeEmailOpen(true);
                  }}
                  className="text-[11px] font-bold text-[#0B4D58] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                readOnly
                title="Registered email address. Click 'Change' to update with OTP verification."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 cursor-not-allowed select-text font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  setNewEmailInput("");
                  setOtpInput("");
                  setEmailStep("enter-email");
                  setEmailOtpError(null);
                  setEmailOtpSuccess(null);
                  setOtpPreviewCode(null);
                  setIsChangeEmailOpen(true);
                }}
                className="absolute inset-y-1.5 right-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-[#0B4D58] text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1"
                title="Change your email with OTP verification"
              >
                <span>Change</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Email can be changed with 6-digit OTP verification.
            </p>
          </div>

          {/* Mobile Number (mobile number - non-changeable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Mobile Number
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                Non-changeable
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={phone}
                readOnly
                title="Mobile number is permanently bound to this account and cannot be modified."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 cursor-not-allowed select-text font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Mobile number is permanently bound to this account for security.
            </p>
          </div>

          {/* Date of Birth (dob) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Date of Birth
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
            </div>
          </div>

          {/* Gender (gender) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition cursor-pointer"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* Delivery Location / City */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Delivery Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. Baneshwor, Kathmandu"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
            </div>
          </div>
        </div>

        {/* Save Profile Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="px-6 py-2.5 bg-[#0B4D58] hover:bg-[#083a42] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── 3. Account Password Section (account password) ── */}
      <div className="pt-6 border-t border-slate-200/80">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg">
            <KeyRound className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Account Password
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-5 ml-9">
          Ensure your account uses a secure password with at least 8 characters
        </p>

        {passwordSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        {passwordErrorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters (letters, numbers, symbols)"
                required
                minLength={8}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 bg-[#0B4D58] hover:bg-[#083a42] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Avatar Picker Modal ── */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0B4D58]" />
                <span>Select Profile Picture</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Choose an avatar below or provide an image link:
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(url);
                    setIsAvatarModalOpen(false);
                  }}
                  className={`p-1 rounded-2xl border-2 transition-all cursor-pointer ${
                    avatarUrl === url
                      ? "border-[#0B4D58] scale-105 shadow-md"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Avatar ${i + 1}`}
                    className="w-full h-16 rounded-xl object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Or Paste Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0B4D58]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarInput.trim()) {
                      setAvatarUrl(customAvatarInput.trim());
                      setCustomAvatarInput("");
                      setIsAvatarModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#0B4D58] hover:bg-[#083a42] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Email Address OTP Modal ── */}
      {isChangeEmailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0B4D58]" />
                <span>Change Email Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsChangeEmailOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Messages */}
            {emailOtpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{emailOtpError}</span>
              </div>
            )}

            {emailOtpSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{emailOtpSuccess}</span>
              </div>
            )}

            {emailStep === "enter-email" ? (
              /* Step 1: Input New Email */
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">
                    Current Registered Email
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{email}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    New Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder="e.g. new.email@gmail.com"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0B4D58]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    We will send a 6-digit verification code (OTP) to this address to verify your ownership.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeEmailOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="px-5 py-2 bg-[#0B4D58] hover:bg-[#083a42] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Enter OTP */
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80">
                  <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold block mb-0.5">
                    Verification Code Sent
                  </span>
                  <p className="text-xs text-emerald-900">
                    We sent a 6-digit OTP code to: <strong>{newEmailInput}</strong>
                  </p>
                </div>

                {otpPreviewCode && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                    <span>
                      Dev OTP: <strong>{otpPreviewCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpInput(otpPreviewCode)}
                      className="text-[11px] font-bold text-amber-800 underline cursor-pointer"
                    >
                      Fill OTP
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Enter 6-Digit OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    required
                    autoFocus
                    className="w-full text-center tracking-[0.3em] font-mono text-lg py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B4D58]"
                  />
                  <div className="flex items-center justify-between mt-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStep("enter-email");
                        setOtpInput("");
                        setEmailOtpError(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      ← Change email
                    </button>

                    {otpCountdown > 0 ? (
                      <span className="text-slate-400">Resend in {otpCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={isSendingOtp}
                        className="text-[#0B4D58] font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChangeEmailOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpInput.length < 4}
                    className="px-5 py-2 bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Verify & Update Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);


  // ── 1. My Orders State ──
  const [orders, setOrders] = useState<UserOrder[]>([
    {
      _id: "demo-ord-1",
      orderNumber: "BM-ORD-9281",
      orderStatus: "Delivered",
      pricing: { grandTotal: 345, itemsTotal: 320, deliveryFee: 25 },
      paymentMethod: "Cash on delivery",
      deliveryAddress: { addressLine: "Baneshwor, Kathmandu", city: "Kathmandu" },
      createdAt: "2026-11-07T14:20:00.000Z",
      items: [
        {
          name: "Amul Gold Full Cream Milk",
          quantity: 2,
          price: 54,
          unit: "500 ml",
          image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80",
        },
        {
          name: "Farm Fresh Green Capsicum",
          quantity: 1,
          price: 70,
          unit: "500 g",
          image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&q=80",
        },
      ],
    },
    {
      _id: "demo-ord-2",
      orderNumber: "BM-ORD-7742",
      orderStatus: "Out for delivery",
      pricing: { grandTotal: 185, itemsTotal: 165, deliveryFee: 20 },
      paymentMethod: "Online Payment",
      deliveryAddress: { addressLine: "Plato 19, Dwarka Sector 5", city: "New Delhi" },
      createdAt: "2026-11-09T18:15:00.000Z",
      items: [
        {
          name: "Cadbury Dairy Milk Silk Chocolate Bar",
          quantity: 1,
          price: 165,
          unit: "150g Bar",
          image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&q=80",
        },
      ],
    },
  ]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [cancelModalOrder, setCancelModalOrder] = useState<UserOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("Ordered by mistake / Duplicate order");
  const [customCancelReason, setCustomCancelReason] = useState<string>("");
  const [cancelLoading, setCancelLoading] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleOpenCancelModal = (order: UserOrder) => {
    setCancelModalOrder(order);
    setCancelReason("Ordered by mistake / Duplicate order");
    setCustomCancelReason("");
    setCancelError(null);
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancelLoading(true);
    setCancelError(null);

    const finalReason =
      cancelReason === "Other reason" && customCancelReason.trim()
        ? customCancelReason.trim()
        : cancelReason;

    try {
      const activeToken = token || localStorage.getItem("token");
      const res = await fetch(`/api/orders/${cancelModalOrder._id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel order.");
      }

      // Update orders in state
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === cancelModalOrder._id
            ? {
                ...ord,
                orderStatus: "CANCELLED",
                statusHistory: data.data?.statusHistory || [
                  ...(ord.statusHistory || []),
                  {
                    status: "CANCELLED",
                    timestamp: new Date().toISOString(),
                    reason: finalReason,
                  },
                ],
              }
            : ord
        )
      );

      setCancelSuccessMsg(
        `Order #${cancelModalOrder.orderNumber || cancelModalOrder._id.slice(-8).toUpperCase()} was cancelled successfully.`
      );
      setCancelModalOrder(null);
      setTimeout(() => setCancelSuccessMsg(null), 5000);
    } catch (err: any) {
      setCancelError(err?.message || "Failed to cancel order. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // ── 2. My Address Book State ──
  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      _id: "addr1",
      type: "Home",
      addressLine: "Floor 5, Building name, land mark, Baneshwor, kathmandu",
      city: "Kathmandu",
      phone: "9868686868",
      isDefault: true,
      latitude: 27.7172,
      longitude: 85.324,
    },
    {
      _id: "addr2",
      type: "Home",
      addressLine: "Plato 19, Dwarka Sector 5, New Delhi",
      city: "New Delhi",
      phone: "9812345678",
      latitude: 28.5921,
      longitude: 77.046,
    },
    {
      _id: "addr3",
      type: "Work",
      addressLine: "Pocket 24, Rohini Sector 24, Delhi",
      city: "Delhi",
      phone: "9876543210",
      latitude: 28.7212,
      longitude: 77.1038,
    },
  ]);

  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddr, setNewAddr] = useState({
    type: "Home",
    addressLine: "",
    houseNo: "",
    landmark: "",
    city: "Kathmandu",
    phone: "",
    isDefault: false,
  });

  // ── 3. My Wishlist State ──
  const [wishlist, setWishlist] = useState<WishlistItem[]>([
    {
      productId: "w1",
      name: "Amul Pure Ghee Pouch",
      price: 320,
      originalPrice: 350,
      weight: "500 ml",
      category: "Dairy, Bread & Eggs",
      image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&q=80",
    },
    {
      productId: "w2",
      name: "Fortune Sunlite Refined Sunflower Oil",
      price: 155,
      originalPrice: 180,
      weight: "1 Litre Pouch",
      category: "Masala, Oil & More",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80",
    },
    {
      productId: "w3",
      name: "Maggi 2-Minute Masala Instant Noodles 4-Pack",
      price: 55,
      originalPrice: 60,
      weight: "280g (4 x 70g)",
      category: "Snacks & Munchies",
      image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&q=80",
    },
  ]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // ── 4. My Reviews State ──
  const [reviews] = useState<UserReview[]>([
    {
      _id: "rev1",
      productName: "Amul Gold Full Cream Milk",
      rating: 5,
      comment: "Super fresh milk, reached in 12 minutes! Very convenient service.",
      date: "Yesterday",
      isVerifiedBuyer: true,
    },
    {
      _id: "rev2",
      productName: "Cadbury Dairy Milk Silk Chocolate Bar",
      rating: 5,
      comment: "Chilled and completely unbroken. Kids loved it!",
      date: "Nov 5, 2026",
      isVerifiedBuyer: true,
    },
  ]);

  // Fetch real data from backend when user token exists
  useEffect(() => {
    const activeToken =
      token || (typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null);

    if (!activeToken) return;

    dispatch(fetchCurrentUser());

    let isMounted = true;

    const loadProfileData = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      setOrdersLoading(true);
      setWishlistLoading(true);

      try {
        const [addrRes, ordRes, wishRes] = await Promise.allSettled([
          fetch("/api/address", { headers: { Authorization: `Bearer ${activeToken}` } }).then((r) =>
            r.json()
          ),
          fetch("/api/orders/my-orders", {
            headers: { Authorization: `Bearer ${activeToken}` },
          }).then((r) => r.json()),
          fetch("/api/wishlist", { headers: { Authorization: `Bearer ${activeToken}` } }).then(
            (r) => r.json()
          ),
        ]);

        if (!isMounted) return;

        if (
          addrRes.status === "fulfilled" &&
          addrRes.value?.success &&
          Array.isArray(addrRes.value.data) &&
          addrRes.value.data.length > 0
        ) {
          setAddresses(addrRes.value.data);
        }
        if (
          ordRes.status === "fulfilled" &&
          ordRes.value?.success &&
          Array.isArray(ordRes.value.data) &&
          ordRes.value.data.length > 0
        ) {
          setOrders(ordRes.value.data);
        }
        if (
          wishRes.status === "fulfilled" &&
          wishRes.value?.success &&
          Array.isArray(wishRes.value.data) &&
          wishRes.value.data.length > 0
        ) {
          setWishlist(wishRes.value.data);
        }
      } finally {
        if (isMounted) {
          setOrdersLoading(false);
          setWishlistLoading(false);
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [token, dispatch]);

  const handleRefresh = async () => {
    try {
      await dispatch(fetchCurrentUser());
    } catch {}
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  // ── Address Actions ──
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine.trim() || !newAddr.phone.trim()) {
      alert("Please enter address details and a valid phone number.");
      return;
    }

    const created: SavedAddress = {
      _id: `custom_${Date.now()}`,
      type: newAddr.type,
      addressLine: `${newAddr.houseNo ? newAddr.houseNo + ", " : ""}${newAddr.addressLine}${
        newAddr.landmark ? ", near " + newAddr.landmark : ""
      }${newAddr.city ? ", " + newAddr.city : ""}`,
      city: newAddr.city,
      phone: newAddr.phone,
      isDefault: newAddr.isDefault,
    };

    if (token) {
      try {
        await fetch("/api/address", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddr),
        });
      } catch {}
    }

    setAddresses((prev) => [created, ...prev]);
    setIsAddAddressOpen(false);
    setNewAddr({
      type: "Home",
      addressLine: "",
      houseNo: "",
      landmark: "",
      city: "Kathmandu",
      phone: "",
      isDefault: false,
    });
  };

  const handleDeleteAddress = async (addrId?: string) => {
    if (!addrId) return;
    if (confirm("Are you sure you want to remove this address?")) {
      if (token) {
        try {
          await fetch(`/api/address/${addrId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {}
      }
      setAddresses((prev) => prev.filter((a) => a._id !== addrId));
    }
  };

  const handleSetDefaultAddress = async (addrId?: string) => {
    if (!addrId) return;
    if (token) {
      try {
        await fetch(`/api/address/${addrId}/default`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a._id === addrId,
      }))
    );
  };

  // ── Wishlist Actions ──
  const handleRemoveWishlist = async (productId: string) => {
    if (token) {
      try {
        await fetch(`/api/wishlist/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    setWishlist((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleAddWishlistToCart = (item: WishlistItem) => {
    dispatch(
      addToCart({
        _id: item.productId,
        name: item.name,
        price: item.price,
        unit: item.weight || "1 unit",
        images: item.image ? [{ url: item.image }] : undefined,
      })
    );
    dispatch(openCart());
  };

  // ── Re-order Items Action ──
  const handleReorder = (order: UserOrder) => {
    order.items.forEach((it) => {
      dispatch(
        addToCart({
          _id: it.productId || it._id || `reord_${Date.now()}`,
          name: it.name,
          price: it.price,
          unit: it.unit || "1 pack",
          images: it.image ? [{ url: it.image }] : undefined,
        })
      );
    });
    dispatch(openCart());
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans select-none">
      <Header />

      {/* ── Main Container ── */}
      <main className="flex-1 w-[90%] lg:w-[85%] mx-auto py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* ── Left Sidebar Navigation (Matching Image 5) ── */}
        <aside className="w-full md:w-64 lg:w-72 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs shrink-0">
          {/* Group 1: YOUR INFORMATION */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block mb-2 px-3">
              YOUR INFORMATION
            </span>

            <div className="space-y-1">
              {/* My Profile */}
              <button
                type="button"
                onClick={() => router.push("/profile?tab=profile", { scroll: false })}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === "profile"
                    ? "bg-[#EAF5E9] text-[#2E7D32] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </button>

              {/* Your orders */}
              <button
                type="button"
                onClick={() => router.push("/profile?tab=orders", { scroll: false })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === "orders"
                    ? "bg-[#EAF5E9] text-[#2E7D32] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Your orders</span>
                </div>
                {orders.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {orders.length}
                  </span>
                )}
              </button>

              {/* Address Book */}
              <button
                type="button"
                onClick={() => router.push("/profile?tab=address", { scroll: false })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === "address" || activeTab === "address-book"
                    ? "bg-[#EAF5E9] text-[#2E7D32] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Address Book</span>
                </div>
                {addresses.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {addresses.length}
                  </span>
                )}
              </button>

              {/* My Wishlist */}
              <button
                type="button"
                onClick={() => router.push("/profile?tab=wishlist", { scroll: false })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === "wishlist"
                    ? "bg-[#EAF5E9] text-[#2E7D32] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>My Wishlist</span>
                </div>
                {wishlist.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* My Reviews */}
              <button
                type="button"
                onClick={() => router.push("/profile?tab=reviews", { scroll: false })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-left ${
                  activeTab === "reviews"
                    ? "bg-[#EAF5E9] text-[#2E7D32] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>My Reviews</span>
                </div>
                {reviews.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                    {reviews.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Group 2: OTHER INFORMATION */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block mb-2 px-3">
              OTHER INFORMATION
            </span>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => alert("BhansaMart Web App: Share with friends and family!")}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <Share2 className="w-4 h-4" />
                <span>Share the app</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  alert("Customer Support: Email support@bhansamart.com or Call 9868686868")
                }
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help and support</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  alert(
                    "BhansaMart: Simplifying Your Kitchen Needs. Delivering fresh groceries in 15-25 minutes."
                  )
                }
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
              >
                <Info className="w-4 h-4" />
                <span>About us</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left mt-2 pt-2 border-t border-slate-100"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right Content Area ── */}
        <section className="flex-1 w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs min-h-[500px]">
          {/* Guest Mode Notice if unauthenticated */}
          {!token && !user && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  You are in Guest Mode. Please log in to load and edit your live BhansaMart account details.
                </span>
              </div>
              <Link
                href="/login"
                className="px-5 py-2 bg-[#0B4D58] hover:bg-[#083a42] text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0"
              >
                Log In
              </Link>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 1: MY PROFILE
              ══════════════════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <ProfileTabContent
              key={`${user?._id || "guest"}-${user?.name || ""}-${user?.email || ""}-${user?.phone || ""}-${user?.gender || ""}-${user?.dateOfBirth || ""}-${user?.avatar || ""}`}
              user={user}
              onRefresh={handleRefresh}
            />
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: MY ORDERS (my order)
              ══════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    My Orders
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track live deliveries and view previous order invoices
                  </p>
                </div>
                {ordersLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0C831F]" />
                    <span>Loading orders...</span>
                  </div>
                )}
              </div>

              {/* Cancel Success Alert */}
              {cancelSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
                  <span>{cancelSuccessMsg}</span>
                  <button
                    type="button"
                    onClick={() => setCancelSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {orders.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/80">
                  <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No orders placed yet</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                    Add fresh groceries, fruits, snacks and veggies to your cart for 15-25 min delivery!
                  </p>
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs inline-block transition"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const isDelivered = ord.orderStatus?.toLowerCase().includes("delivered");
                    const isOut = ord.orderStatus?.toLowerCase().includes("out");
                    const isCancelled = ord.orderStatus?.toLowerCase().includes("cancel");
                    const isExpanded = !!expandedOrderIds[ord._id];
                    const activeStep = getActiveOrderStep(ord.orderStatus);
                    const isCancellable = !["DELIVERED", "OUT_FOR_DELIVERY", "CANCELLED", "REJECTED"].includes(
                      (ord.orderStatus || "").toUpperCase()
                    );

                    return (
                      <div
                        key={ord._id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-2xs"
                      >
                        {/* Order Header Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                                {ord.orderNumber || `#${ord._id.slice(-8).toUpperCase()}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {new Date(ord.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {ord.deliveryAddress?.addressLine || "Home Delivery"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isOut
                                  ? "bg-blue-100 text-blue-800 animate-pulse"
                                  : isCancelled
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isDelivered
                                    ? "bg-emerald-600"
                                    : isOut
                                    ? "bg-blue-600"
                                    : isCancelled
                                    ? "bg-rose-600"
                                    : "bg-amber-600"
                                }`}
                              />
                              {ord.orderStatus || "Processing"}
                            </span>
                          </div>
                        </div>

                        {/* Order Items List */}
                        <div className="py-3.5 space-y-3">
                          {ord.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-semibold text-slate-900 leading-tight">
                                    {item.name}
                                  </h5>
                                  <span className="text-[11px] text-slate-500 font-normal">
                                    Qty: {item.quantity} {item.unit ? `• ${item.unit}` : ""}
                                  </span>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span>Payment: <strong className="text-slate-800">{ord.paymentMethod || "Cash on delivery"}</strong></span>
                            <span>• Total: <strong className="text-slate-900 text-sm">₹{ord.pricing?.grandTotal || ord.totalAmount || 0}</strong></span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* ── Cancel Order Button (Available before dispatch / delivery) ── */}
                            {isCancellable && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(ord)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Cancel this order"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cancel Order</span>
                              </button>
                            )}

                            {/* ── Tracking Dropdown Toggle Button ── */}
                            <button
                              type="button"
                              onClick={() => toggleOrderExpand(ord._id)}
                              className={`px-3 py-1.5 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer border ${
                                isExpanded
                                  ? "bg-emerald-50 text-[#0C831F] border-emerald-300 ring-2 ring-emerald-200/60 shadow-xs"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <Truck className="w-3.5 h-3.5 text-[#0C831F]" />
                              <span>{isExpanded ? "Hide Tracking" : "Track Order"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReorder(ord)}
                              className="px-4 py-1.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder</span>
                            </button>
                          </div>
                        </div>

                        {/* ── Expandable Tracking Details Dropdown ── */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            
                            {/* Cancellation Banner inside tracking if eligible */}
                            {isCancellable && (
                              <div className="bg-amber-50/90 rounded-2xl p-3.5 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2 text-amber-800">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Need to change plans? You can cancel your order before it leaves the store.</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(ord)}
                                  className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition cursor-pointer shadow-2xs"
                                >
                                  Cancel Order
                                </button>
                              </div>
                            )}
                            
                            {/* 1. Live Tracking Stepper Header */}
                            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/70">
                              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/60">
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-emerald-700" />
                                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Live Order Tracking
                                  </h4>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {ord.estimatedDeliveryTime || "15-25 Mins Express Delivery"}
                                </span>
                              </div>

                              {isCancelled ? (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>This order was cancelled. Any prepaid payments will be refunded within 3-5 business days.</span>
                                </div>
                              ) : (
                                <div className="relative flex items-center justify-between px-2 sm:px-6 my-2">
                                  {/* Progress Track Line */}
                                  <div className="absolute left-6 right-6 top-3.5 h-1 bg-slate-200 -z-0" />
                                  <div
                                    className="absolute left-6 top-3.5 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                                    style={{
                                      width: `${(Math.min(activeStep, 4) / 4) * 88}%`,
                                    }}
                                  />

                                  {ORDER_TRACKING_STEPS.map((stg, idx) => {
                                    const isDone = idx <= activeStep;
                                    const isCurrent = idx === activeStep;

                                    return (
                                      <div key={stg.key} className="flex flex-col items-center text-center relative z-10">
                                        <div
                                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                            isDone
                                              ? "bg-[#0C831F] text-white ring-4 ring-emerald-100"
                                              : "bg-white text-slate-400 border border-slate-300"
                                          }`}
                                        >
                                          {isDone ? (
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          ) : (
                                            <span>{idx + 1}</span>
                                          )}
                                        </div>
                                        <span
                                          className={`text-[10px] sm:text-[11px] mt-1.5 font-bold max-w-[70px] leading-tight ${
                                            isCurrent
                                              ? "text-emerald-700 font-extrabold"
                                              : isDone
                                              ? "text-slate-800"
                                              : "text-slate-400"
                                          }`}
                                        >
                                          {stg.label}
                                        </span>
                                        <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5">
                                          {stg.desc}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* 2. Delivery Address & Bill Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Delivery Address Card */}
                              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/60 space-y-2 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1.5 border-b border-slate-200/60">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Delivery Address Details</span>
                                </div>
                                <div className="text-[11px] text-slate-700 leading-relaxed font-medium space-y-1">
                                  <p className="font-semibold text-slate-900">
                                    {ord.deliveryAddress?.addressLine || "Home Delivery Address"}
                                  </p>
                                  {ord.deliveryAddress?.houseNo ? (
                                    <p className="text-slate-600">Flat / House: {ord.deliveryAddress.houseNo}</p>
                                  ) : null}
                                  {ord.deliveryAddress?.landmark ? (
                                    <p className="text-slate-600">Landmark: {ord.deliveryAddress.landmark}</p>
                                  ) : null}
                                  {ord.deliveryAddress?.city ? (
                                    <p className="text-slate-600">City: {ord.deliveryAddress.city}</p>
                                  ) : null}
                                  {ord.deliveryAddress?.phone ? (
                                    <p className="text-slate-700 flex items-center gap-1 pt-1 font-semibold">
                                      <Phone className="w-3 h-3 text-slate-400" />
                                      <span>Contact Phone: {ord.deliveryAddress.phone}</span>
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              {/* Bill & Payment Summary Card */}
                              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/60 space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 pb-1.5 border-b border-slate-200/60">
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Bill & Payment Summary</span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-[11px]">
                                  <span>Items Total</span>
                                  <span className="font-semibold text-slate-800">
                                    ₹{ord.pricing?.itemsTotal || ord.itemsTotal || ord.items.reduce((s, it) => s + it.price * it.quantity, 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-[11px]">
                                  <span>Handling Charge</span>
                                  <span className="font-semibold text-slate-800">
                                    ₹{ord.handlingCharge ?? 30}
                                  </span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-[11px]">
                                  <span>Delivery Charge</span>
                                  <span className="font-semibold text-emerald-700">
                                    {ord.deliveryCharge === 0 || ord.pricing?.deliveryFee === 0 ? "FREE" : `₹${ord.deliveryCharge || ord.pricing?.deliveryFee || 0}`}
                                  </span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200/60 text-xs">
                                  <span>Grand Total</span>
                                  <span className="text-sm font-black text-slate-900">
                                    ₹{ord.pricing?.grandTotal || ord.totalAmount || 0}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 pt-0.5">
                                  Payment Method: <span className="font-semibold text-slate-700">{ord.paymentMethod || "Cash on delivery"}</span>
                                </div>
                              </div>
                            </div>

                            {/* 3. Status History Updates Log (If present from backend) */}
                            {ord.statusHistory && ord.statusHistory.length > 0 ? (
                              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60 text-xs">
                                <span className="font-bold text-slate-800 block mb-2 text-[11px] uppercase tracking-wider">
                                  Status Timeline Log
                                </span>
                                <div className="space-y-1.5">
                                  {ord.statusHistory.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between text-slate-600 text-[11px]">
                                      <span className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                        <span className="font-semibold text-slate-800">{h.status}</span>
                                        {h.reason ? <span className="text-slate-500">• {h.reason}</span> : null}
                                      </span>
                                      <span className="text-slate-400 font-mono text-[10px]">
                                        {new Date(h.timestamp).toLocaleTimeString("en-US", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: ADDRESS BOOK (my address)
              ══════════════════════════════════════════════════════════ */}
          {(activeTab === "address" || activeTab === "address-book") && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Row (Matching Image 5) */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Address Book
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your saved addresses
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#43A047] hover:bg-[#388E3C] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add new address</span>
                </button>
              </div>

              {/* Address Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((addr, idx) => (
                  <div
                    key={addr._id || idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/60 hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-[#EAF5E9] text-[#2E7D32] rounded-xl">
                          <HomeIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{addr.type}</h4>
                        {addr.isDefault ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md ml-auto">
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-emerald-700 ml-auto cursor-pointer"
                          >
                            Set Default
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">
                        {addr.addressLine}
                      </p>

                      <p className="text-xs text-slate-800 font-semibold flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone no: {addr.phone}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this saved address?")) {
                              handleDeleteAddress(addr._id);
                            }
                          }}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-300 transition cursor-pointer"
                          title="Options / Delete address"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Shared address: ${addr.addressLine}`)}
                          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition cursor-pointer"
                          title="Share address"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          dispatch(
                            setAddress({
                              name: addr.type,
                              city: addr.city || "Kathmandu",
                              addressLine: addr.addressLine,
                              lat: addr.latitude || 27.7172,
                              lng: addr.longitude || 85.324,
                            })
                          );
                          alert(`Selected delivery address: ${addr.addressLine}`);
                        }}
                        className="text-xs font-bold text-[#2E7D32] hover:underline cursor-pointer"
                      >
                        Deliver Here →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: MY WISHLIST (my wislist)
              ══════════════════════════════════════════════════════════ */}
          {activeTab === "wishlist" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>My Wishlist</span>
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Your saved items and favorite grocery products
                  </p>
                </div>
                {wishlistLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    <span>Loading wishlist...</span>
                  </div>
                )}
              </div>

              {wishlist.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/80">
                  <Heart className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">Your wishlist is empty</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                    Tap the heart icon on any product to save it here for quick shopping!
                  </p>
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs inline-block transition"
                  >
                    Browse Groceries
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-300 transition-all shadow-2xs group"
                    >
                      <div>
                        {/* Image & Remove Icon */}
                        <div className="relative w-full h-36 bg-slate-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                          <img
                            src={
                              item.image ||
                              item.imageUrl ||
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80"
                            }
                            alt={item.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWishlist(item.productId)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-xs transition cursor-pointer"
                            title="Remove from Wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title & Weight */}
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          {item.category || "Grocery"}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 min-h-[2.5rem]">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.weight || "1 unit"}</p>
                      </div>

                      {/* Price & Add to Cart Button */}
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            ₹{item.price}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{item.originalPrice}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddWishlistToCart(item)}
                          className="px-4 py-1.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: MY REVIEWS (my review)
              ══════════════════════════════════════════════════════════ */}
          {activeTab === "reviews" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  My Reviews
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Product reviews and ratings you have shared with the BhansaMart community
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/80">
                  <Star className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">No reviews yet</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm mx-auto">
                    Rate and review groceries after your order arrives to help other shoppers!
                  </p>
                  <Link
                    href="/"
                    className="px-6 py-2.5 bg-[#0C831F] hover:bg-[#0a6f1a] text-white font-bold text-xs rounded-xl shadow-xs inline-block transition"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200 fill-slate-200"
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1.5">
                            {rev.rating}.0
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {rev.date}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        {rev.productName}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        &quot;{rev.comment}&quot;
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          Verified Purchase Review
                        </span>
                        <span className="text-slate-400">BhansaMart Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* ── Add New Address Modal ── */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Address</h3>
              <button
                type="button"
                onClick={() => setIsAddAddressOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAddr((p) => ({ ...p, type: t }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        newAddr.type === t
                          ? "bg-[#2E7D32] text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  House / Flat / Floor No.
                </label>
                <input
                  type="text"
                  value={newAddr.houseNo}
                  onChange={(e) => setNewAddr((p) => ({ ...p, houseNo: e.target.value }))}
                  placeholder="e.g. Floor 5, Flat 502"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street / Area / Landmark *
                </label>
                <input
                  type="text"
                  value={newAddr.addressLine}
                  onChange={(e) => setNewAddr((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder="e.g. Baneshwor, near City Center"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                    placeholder="e.g. Kathmandu / Delhi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 9868686868"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3 bg-[#43A047] hover:bg-[#388E3C] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Order Confirmation Modal ── */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base text-slate-900">Cancel Order</h3>
              </div>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancelModalOrder(null)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel order{" "}
                  <strong className="text-slate-900">
                    {cancelModalOrder.orderNumber || `#${cancelModalOrder._id.slice(-8).toUpperCase()}`}
                  </strong>
                  ? Once cancelled, active packing and delivery dispatch will be halted immediately.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Please select a reason for cancellation:
                </label>
                <div className="space-y-2">
                  {[
                    "Ordered by mistake / Duplicate order",
                    "Delivery is taking longer than expected",
                    "Need to modify items or order details",
                    "Incorrect delivery address or phone number",
                    "Found better price or alternative elsewhere",
                    "Other reason",
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        cancelReason === reason
                          ? "bg-emerald-50/70 border-[#0C831F] text-slate-900 font-medium"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="accent-[#0C831F]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {cancelReason === "Other reason" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={customCancelReason}
                      onChange={(e) => setCustomCancelReason(e.target.value)}
                      placeholder="Please describe your reason..."
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0C831F]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={cancelLoading}
                  onClick={handleConfirmCancelOrder}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {cancelLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirm Cancel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Component ── */}
      <Footer />

      {/* ── Cart Drawer & Address Selector ── */}
      <CartDrawer />
      <AddressModal />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans text-xs text-slate-500">
          Loading your account details...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
