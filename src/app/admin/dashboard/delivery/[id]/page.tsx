"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bike,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Landmark,
  Layers,
  Mail,
  MapPin,
  Navigation,
  Package,
  Phone,
  Radar,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import * as api from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { useConsole } from "@/lib/admin/console";
import type {
  DeliveryPartnerDocument,
  DeliveryPartnerFullResponse,
  SecurityDepositLedgerItem,
} from "@/lib/admin/types";
import { formatDate, formatDateTime, initials, npr, orderStatusBadge } from "@/lib/seller/format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  Pill,
  StatCard,
  SuccessBanner,
  Tabs,
  btn,
  field,
  fieldLabel,
} from "@/components/admin/ui";

const TABS = [
  { key: "zone", label: "Zone & Location" },
  { key: "vehicle", label: "Vehicle & Bank" },
  { key: "documents", label: "KYC Documents" },
  { key: "deposit", label: "Security Deposit" },
  { key: "orders", label: "Delivery Orders" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const docBadgeConfig = (status?: string) => {
  switch (status) {
    case "VERIFIED":
      return { t: "Verified", c: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10", icon: CheckCircle2 };
    case "PENDING_VERIFICATION":
    case "UNDER_REVIEW":
      return { t: "Under Review", c: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10", icon: Clock };
    case "REJECTED":
      return { t: "Rejected", c: "bg-red-50 text-red-700 border-red-200 ring-red-600/10", icon: XCircle };
    case "RESUBMISSION_REQUIRED":
      return { t: "Resubmission Needed", c: "bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/10", icon: AlertTriangle };
    default:
      return { t: "Not Submitted", c: "bg-slate-100 text-slate-500 border-slate-200 ring-slate-400/10", icon: AlertCircle };
  }
};

const approvalBadgeConfig = (s?: string) => {
  switch (s) {
    case "APPROVED":
      return { t: "Approved Partner", c: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" };
    case "PENDING_APPROVAL":
      return { t: "Pending Approval", c: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" };
    case "SUSPENDED":
      return { t: "Suspended", c: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" };
    case "REJECTED":
      return { t: "Rejected", c: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" };
    case "DEACTIVATED":
      return { t: "Deactivated", c: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
    default:
      return { t: s || "Unknown", c: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  }
};

const availabilityBadgeConfig = (avail?: string, isBusy?: boolean) => {
  if (isBusy || avail === "BUSY") {
    return { t: "On Delivery", c: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500 animate-pulse" };
  }
  if (avail === "ONLINE") {
    return { t: "Online & Ready", c: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
  }
  return { t: "Offline", c: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
};

export default function DeliveryPartnerDetailsPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading delivery partner profile…" />}>
      <PartnerDetailView />
    </Suspense>
  );
}

function PartnerDetailView() {
  const { base } = useConsole();
  const { id } = useParams<{ id: string }>();
  const q = useAsync(() => api.getDeliveryPartnerDetails(id), id);
  const [tab, setTab] = useState<TabKey>("zone");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("APPROVED");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Document Review Modal
  const [reviewingDoc, setReviewingDoc] = useState<{
    type: "panCard" | "aadhaarCard" | "drivingLicense" | "vehicleRc";
    name: string;
    doc: DeliveryPartnerDocument;
  } | null>(null);
  const [docNewStatus, setDocNewStatus] = useState<string>("VERIFIED");
  const [docRejectionReason, setDocRejectionReason] = useState("");
  const [docReviewerComments, setDocReviewerComments] = useState("");
  const [updatingDoc, setUpdatingDoc] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const data = q.data;
  if (q.loading && !data) return <LoadingBlock text="Loading delivery partner details…" />;
  if (!data || !data.partner) {
    return <ErrorBanner message={q.error || "Delivery partner profile not found."} onRetry={q.reload} />;
  }

  const p = data.partner;
  const docs = p.documents || {};
  const vehicle = p.vehicleDetails;
  const deposit = p.securityDeposit;
  const coords = p.currentLocation?.coordinates;
  const hasCoords = Array.isArray(coords) && coords.length === 2 && (coords[0] !== 0 || coords[1] !== 0);
  const lng = hasCoords ? coords[0] : 85.324;
  const lat = hasCoords ? coords[1] : 27.7172;
  const isOnline = p.availability === "ONLINE";
  const isBusy = p.availability === "BUSY" || Boolean(p.activeOrderId);
  const avail = availabilityBadgeConfig(p.availability, isBusy);
  const appBadge = approvalBadgeConfig(p.approvalStatus);

  // Document verification count
  const allDocList = [docs.drivingLicense, docs.vehicleRc, docs.panCard, docs.aadhaarCard];
  const verifiedDocCount = allDocList.filter((d) => d?.status === "VERIFIED").length;
  const docPercent = Math.round((verifiedDocCount / 4) * 100);

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    setActionError(null);
    setNotice(null);
    try {
      await api.updateDeliveryPartnerApproval(p._id, {
        approvalStatus: newStatus,
        adminRemarks: adminRemarks.trim() || undefined,
      });
      setNotice(`Delivery partner approval status updated to ${newStatus}.`);
      setStatusModalOpen(false);
      q.reload();
    } catch (e) {
      setActionError(api.errorText(e, "Failed to update approval status."));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReviewDoc = async () => {
    if (!reviewingDoc) return;
    if (docNewStatus === "REJECTED" && !docRejectionReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }
    setUpdatingDoc(true);
    setActionError(null);
    setNotice(null);
    try {
      await api.reviewDeliveryPartnerDocument(p._id, {
        documentType: reviewingDoc.type,
        status: docNewStatus,
        rejectionReason: docRejectionReason.trim() || undefined,
        reviewerComments: docReviewerComments.trim() || undefined,
      });
      setNotice(`${reviewingDoc.name} marked as ${docNewStatus}.`);
      setReviewingDoc(null);
      q.reload();
    } catch (e) {
      setActionError(api.errorText(e, "Failed to update document status."));
    } finally {
      setUpdatingDoc(false);
    }
  };

  const photoUrl =
    typeof p.profilePhoto === "string"
      ? p.profilePhoto
      : p.profilePhoto?.url || "";

  return (
    <>
      <PageHeader
        backHref={`${base}/delivery`}
        title={
          <div className="flex flex-wrap items-center gap-2.5">
            <span>{p.fullName || "Delivery Partner"}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${appBadge.c}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${appBadge.dot}`} />
              {appBadge.t}
            </span>
          </div>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
            <span>ID: <code className="text-slate-700 font-mono font-medium">{p._id}</code></span>
            <span>·</span>
            <span>Zone: <b className="text-slate-800">{p.serviceArea || "Central Kathmandu"}</b> ({p.serviceCity || "Kathmandu"})</span>
            {p.createdAt && (
              <>
                <span>·</span>
                <span>Partner since {formatDate(p.createdAt)}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              onClick={q.reload}
              className={btn.ghost}
              aria-label="Refresh partner profile"
              title="Refresh profile"
            >
              <RefreshCw className={`w-4 h-4 ${q.loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href={`${base}/map`}
              className={`${btn.outline} h-9 text-xs`}
              title="Track fleet live on radar map"
            >
              <Radar className="w-3.5 h-3.5" /> Fleet Radar
            </Link>
            <button
              type="button"
              onClick={() => {
                setNewStatus(p.approvalStatus || "APPROVED");
                setAdminRemarks(p.adminRemarks || "");
                setStatusModalOpen(true);
              }}
              className={`${p.approvalStatus === "APPROVED" ? btn.outline : btn.primary} h-9 text-xs`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Change Status
            </button>
          </>
        }
      />

      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {actionError && <ErrorBanner message={actionError} />}

        {/* HERO PROFILE CARD */}
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent p-5 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-extrabold text-2xl flex items-center justify-center overflow-hidden shadow-md shadow-sky-600/20 border-2 border-white ring-2 ring-sky-100">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt={p.fullName} className="w-full h-full object-cover" />
                    ) : (
                      initials(p.fullName)
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border-2 border-white shadow-sm flex items-center gap-1 ${avail.c}`}
                    title={avail.t}
                  >
                    <span className={`w-2 h-2 rounded-full ${avail.dot}`} />
                    {avail.t}
                  </span>
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {p.fullName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      <Bike className="w-3.5 h-3.5 text-slate-500" />
                      {vehicle?.vehicleType || "Motorcycle"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-[#0284C7] transition-colors"
                        title="Click to call"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#0284C7]" />
                        {p.phone}
                      </a>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-[#0284C7] transition-colors"
                        title="Click to email"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {p.email}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1 font-bold text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-100">
                      <MapPin className="w-3.5 h-3.5" />
                      {p.serviceArea || "Central Kathmandu"} · {p.serviceCity || "Kathmandu"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                      {vehicle?.registrationNumber || "Plate Unassigned"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(vehicle?.registrationNumber || "", "plate")}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy plate number"
                    >
                      {copiedKey === "plate" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {p.user && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${p.user.isActive !== false ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                        Account {p.user.isActive !== false ? "Active" : "Disabled"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Hero Summary Pills */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 sm:flex-none p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-left sm:text-right min-w-[140px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Deposit</p>
                  <p className={`text-sm font-extrabold mt-0.5 flex items-center sm:justify-end gap-1 ${deposit?.status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                    <ShieldCheck className="w-4 h-4" />
                    {deposit?.status === "PAID" ? "Paid (NPR 1,000)" : (deposit?.status || "PENDING")}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{deposit?.gateway ? `${deposit.gateway}` : "Mandatory bond"}</p>
                </div>

                <div className="flex-1 sm:flex-none p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-left sm:text-right min-w-[140px]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KYC Verification</p>
                  <p className={`text-sm font-extrabold mt-0.5 flex items-center sm:justify-end gap-1 ${data.allDocumentsVerified ? "text-emerald-600" : "text-amber-600"}`}>
                    <FileCheck2 className="w-4 h-4" />
                    {verifiedDocCount}/4 Verified
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${data.allDocumentsVerified ? "bg-emerald-500" : "bg-amber-500"}`}
                      style={{ width: `${docPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6 MODERN KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deliveries</span>
              <span className="w-7 h-7 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
                <Bike className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900 leading-none">{p.metrics?.totalDeliveries ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Completed orders</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating</span>
              <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-slate-900 leading-none flex items-center gap-1">
                {(p.metrics?.rating ?? 5.0).toFixed(1)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{p.metrics?.ratingsCount || 0} customer reviews</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Acceptance</span>
              <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-emerald-600 leading-none">{p.metrics?.acceptanceRate ?? 100}%</p>
              <p className="text-[11px] text-slate-500 mt-1">Dispatch rate</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cash in Hand</span>
              <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none truncate">{npr(p.codCashInCustody || 0)}</p>
              <p className="text-[11px] text-slate-500 mt-1">COD in physical custody</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Wallet</span>
              <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none truncate">{npr(p.wallet?.currentBalance || 0)}</p>
              <p className="text-[11px] text-slate-500 mt-1">Earned: {npr(p.wallet?.totalEarned || 0)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Zone City</span>
              <span className="w-7 h-7 rounded-xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <p className="text-lg sm:text-xl font-black text-slate-900 leading-none truncate">{p.serviceCity || "Kathmandu"}</p>
              <p className="text-[11px] text-slate-500 mt-1 truncate">{p.serviceArea || "Central Area"}</p>
            </div>
          </div>
        </div>

        {/* ACTIVE ORDER BANNER (IF APPLICABLE) */}
        {p.activeOrderId && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <span className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Navigation className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Live In Transit</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                    {p.activeOrderId.orderStatus?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  Order #{p.activeOrderId.orderNumber} · {npr(p.activeOrderId.totalAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payment: {p.activeOrderId.paymentMethod || "COD"} · Status: {p.activeOrderId.paymentStatus || "PENDING"}
                </p>
              </div>
            </div>
            <Link
              href={`${base}/orders?search=${encodeURIComponent(p.activeOrderId.orderNumber || "")}`}
              className={`${btn.primary} h-9 text-xs px-4 shrink-0 shadow-md shadow-sky-600/15`}
            >
              Inspect Active Order
            </Link>
          </div>
        )}

        {/* MODERN TAB BAR */}
        <div className="pt-2">
          <Tabs
            tabs={TABS}
            active={tab}
            onChange={setTab}
            counts={{
              documents: verifiedDocCount,
              orders: data.recentOrders?.length,
            }}
          />
        </div>

        {/* TAB 1: Coverage Zone & Location */}
        {tab === "zone" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Operational Zone Specs */}
            <div className="lg:col-span-6 space-y-4">
              <Card title="Dispatch Zone & Territory Coverage">
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                        <span>Assigned Zone</span>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        {p.serviceArea || "Central Kathmandu"}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Default dispatch sector for nearby store order matching.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                        <span>Operating City</span>
                        <Navigation className="w-4 h-4" />
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        {p.serviceCity || "Kathmandu"}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Municipal territory and hub allocation.
                      </p>
                    </div>
                  </div>

                  {/* Residential Address Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Residential Address
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${p.currentAddress?.addressLine || ""}, ${p.currentAddress?.city || ""}`,
                            "address"
                          )
                        }
                        className="text-xs text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1"
                      >
                        {copiedKey === "address" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Address
                      </button>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800">
                      {p.currentAddress?.addressLine || "No specific address line registered"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[p.currentAddress?.city, p.currentAddress?.state, p.currentAddress?.pincode]
                        .filter(Boolean)
                        .join(", ") || "Kathmandu, Bagmati, 44600"}
                    </p>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Emergency Contact (Next of Kin)
                      </span>
                      <span className="text-[11px] text-slate-400">Audit Safety Record</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          {p.emergencyContact?.name || "Not provided"}
                          {p.emergencyContact?.relationship && (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              ({p.emergencyContact.relationship})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {p.emergencyContact?.phone || "No emergency telephone added"}
                        </p>
                      </div>
                      {p.emergencyContact?.phone && (
                        <a
                          href={`tel:${p.emergencyContact.phone}`}
                          className={`${btn.outline} h-8 text-xs px-3`}
                        >
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Live Interactive GPS & Map View */}
            <div className="lg:col-span-6 space-y-4">
              <Card
                title="Live GPS Location Radar"
                action={
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Google Maps
                    </a>
                  </div>
                }
              >
                <div className="p-5 space-y-4">
                  {/* Embedded Leaflet Mini-Map Component */}
                  <RiderMiniMap
                    lat={lat}
                    lng={lng}
                    partnerName={p.fullName}
                    zoneArea={p.serviceArea || "Kathmandu"}
                    availability={p.availability}
                    isBusy={isBusy}
                  />

                  {/* Coordinates & Ping Info */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold block">Latitude / Longitude</span>
                      <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold block">Last GPS Ping</span>
                      <span className="text-slate-700 font-medium mt-0.5 block truncate">
                        {p.lastLocationUpdatedAt ? formatDateTime(p.lastLocationUpdatedAt) : "Awaiting initial ping"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <Radar className="w-4 h-4 text-amber-600" /> Dispatch Algorithm Range
                    </p>
                    <p className="text-amber-700 leading-relaxed text-[11px]">
                      This partner is matched to customer orders within a <b>5 km delivery radius</b> from their active location. Store vendors in <b>{p.serviceCity || "Kathmandu"}</b> receive dispatch priority.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: Vehicle & Bank */}
        {tab === "vehicle" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Vehicle Profile */}
            <div className="lg:col-span-6 space-y-4">
              <Card title="Vehicle Identity & Registration">
                <div className="p-5 space-y-5">
                  {/* Realistic Vehicle Plate Container */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nepal Vehicle Registry</span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-400/30">
                        {vehicle?.vehicleType || "Motorcycle"}
                      </span>
                    </div>
                    <div className="py-2 text-center">
                      <div className="inline-block bg-amber-400 text-slate-950 font-black text-2xl sm:text-3xl tracking-widest px-6 py-2.5 rounded-xl border-2 border-slate-900 shadow-inner font-mono">
                        {vehicle?.registrationNumber || "NOT ASSIGNED"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>License #: <b className="text-slate-200 font-mono">{vehicle?.licenseNumber || "—"}</b></span>
                      <span>Category: <b className="text-slate-200">{vehicle?.vehicleType || "Motorcycle"}</b></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold block">Vehicle Type</span>
                      <span className="font-extrabold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                        <Bike className="w-4 h-4 text-[#0284C7]" />
                        {vehicle?.vehicleType || "Motorcycle"}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 font-bold block">Driving License No.</span>
                      <span className="font-mono font-extrabold text-slate-800 text-sm mt-0.5 block truncate">
                        {vehicle?.licenseNumber || "Unrecorded"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bluebook (Vehicle RC) and Driver License verification photos can be examined and approved under the <b>KYC Documents</b> tab.
                  </p>
                </div>
              </Card>
            </div>

            {/* Right: Bank Account Card */}
            <div className="lg:col-span-6 space-y-4">
              <Card title="Payout Bank & Settlement Account">
                <div className="p-5 space-y-5">
                  {/* Styled Sleek Bank Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-sky-400" />
                        <span className="font-black tracking-wide text-sm">{p.bankDetails?.bankName || "BhansaMart Settlement"}</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Deposit</span>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Account Number</span>
                      <p className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-slate-100">
                        {p.bankDetails?.accountNumber || "•••• •••• •••• ••••"}
                      </p>
                    </div>

                    <div className="flex items-end justify-between relative z-10 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Account Holder</span>
                        <p className="font-extrabold text-sm text-slate-200">{p.bankDetails?.accountHolderName || p.fullName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">IFSC / Branch</span>
                        <p className="font-mono text-sm font-extrabold text-sky-300">{p.bankDetails?.ifscCode || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {p.bankDetails?.upiId && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 font-bold block">UPI / eSewa Wallet ID</span>
                        <span className="font-mono font-extrabold text-slate-800 mt-0.5 block">{p.bankDetails.upiId}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        Linked
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: KYC Documents */}
        {tab === "documents" && (
          <div className="space-y-4">
            {/* Verification Status Header */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    data.allDocumentsVerified
                      ? "bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50"
                      : "bg-amber-100 text-amber-700 ring-4 ring-amber-50"
                  }`}
                >
                  <FileCheck2 className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Onboarding Document Verification ({verifiedDocCount}/4 Verified)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {data.allDocumentsVerified
                      ? "All 4 mandatory documents have been audited and verified. Partner is cleared for dispatch."
                      : "Partner has pending or unverified documents. Review and update their status below."}
                  </p>
                </div>
              </div>
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border ${
                  data.allDocumentsVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {data.allDocumentsVerified ? "Fully Verified" : "Pending Action"}
              </span>
            </div>

            {/* 4 DOCUMENT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: "drivingLicense" as const, name: "Driving License", doc: docs.drivingLicense, icon: Bike },
                { type: "vehicleRc" as const, name: "Vehicle RC / Bluebook", doc: docs.vehicleRc, icon: FileText },
                { type: "panCard" as const, name: "PAN Card", doc: docs.panCard, icon: CreditCard },
                { type: "aadhaarCard" as const, name: "Aadhaar / Citizenship ID", doc: docs.aadhaarCard, icon: Shield },
              ].map(({ type, name, doc, icon: DocIcon }) => {
                const b = docBadgeConfig(doc?.status);
                const BadgeIcon = b.icon;
                const hasFront = Boolean(doc?.frontUrl);
                const hasBack = Boolean(doc?.backUrl);

                return (
                  <Card key={type} className="p-5 flex flex-col justify-between hover:border-sky-300 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <DocIcon className="w-5 h-5 text-slate-700" />
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900">{name}</h4>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">
                              {doc?.documentNumber ? `ID: ${doc.documentNumber}` : "Document # not recorded"}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${b.c}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {b.t}
                        </span>
                      </div>

                      {/* Photo Previews */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Front Document</span>
                          {hasFront ? (
                            <div
                              onClick={() => setPreviewImage({ title: `${name} (Front)`, url: doc!.frontUrl! })}
                              className="group relative h-32 rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:border-[#0284C7] transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={doc!.frontUrl}
                                alt={`${name} Front`}
                                className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                                <Eye className="w-4 h-4" /> Full View
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                              <FileText className="w-5 h-5 text-slate-300" />
                              <span>Not uploaded</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Back Document</span>
                          {hasBack ? (
                            <div
                              onClick={() => setPreviewImage({ title: `${name} (Back)`, url: doc!.backUrl! })}
                              className="group relative h-32 rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden cursor-pointer shadow-sm hover:border-[#0284C7] transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={doc!.backUrl}
                                alt={`${name} Back`}
                                className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]">
                                <Eye className="w-4 h-4" /> Full View
                              </div>
                            </div>
                          ) : (
                            <div className="h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                              <FileText className="w-5 h-5 text-slate-300" />
                              <span>Not uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {doc?.rejectionReason && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-0.5">
                          <span className="font-bold flex items-center gap-1 text-red-900">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Rejection Reason:
                          </span>
                          <p>{doc.rejectionReason}</p>
                        </div>
                      )}
                      {doc?.reviewerComments && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Auditor Notes: </span>
                          {doc.reviewerComments}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {doc?.verifiedAt ? `Verified: ${formatDate(doc.verifiedAt)}` : "Pending review"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingDoc({ type, name, doc: doc || { status: "NOT_SUBMITTED" } });
                          setDocNewStatus(doc?.status === "VERIFIED" ? "VERIFIED" : "VERIFIED");
                          setDocRejectionReason(doc?.rejectionReason || "");
                          setDocReviewerComments(doc?.reviewerComments || "");
                        }}
                        className={`${btn.primary} h-8 text-xs px-3 shadow-none`}
                      >
                        Review / Update
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Security Deposit */}
        {tab === "deposit" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <StatCard
                label="Required Guarantee"
                value={npr(deposit?.requiredAmount || 1000)}
                sub="Mandatory partner bond"
                icon={Landmark}
                tone="teal"
              />
              <StatCard
                label="Paid Guarantee"
                value={npr(deposit?.paidAmount || 0)}
                sub={`Gateway: ${deposit?.gateway || "eSewa"}`}
                tone="green"
              />
              <StatCard
                label="Payment Status"
                value={deposit?.status || "PENDING"}
                sub={deposit?.paidAt ? `Confirmed ${formatDate(deposit.paidAt)}` : "Awaiting payment"}
                tone={deposit?.status === "PAID" ? "green" : "amber"}
              />
              <StatCard
                label="Gateway Reference"
                value={deposit?.transactionId || "—"}
                sub="Txn confirmation"
                tone="slate"
              />
            </div>

            <Card title="Security Deposit Transaction History & Ledger">
              {data.depositHistory && data.depositHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50/80 border-b border-slate-100">
                        <th className="px-5 py-3.5 font-bold">Date & Time</th>
                        <th className="px-5 py-3.5 font-bold">Transaction Type</th>
                        <th className="px-5 py-3.5 font-bold">Amount</th>
                        <th className="px-5 py-3.5 font-bold">Status</th>
                        <th className="px-5 py-3.5 font-bold">Gateway / Reference</th>
                        <th className="px-5 py-3.5 font-bold">Admin Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.depositHistory.map((item: SecurityDepositLedgerItem) => (
                        <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{formatDateTime(item.createdAt)}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-800">{item.type.replace(/_/g, " ")}</td>
                          <td className="px-5 py-3.5 font-black text-slate-900 text-sm">{npr(item.amount)}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                item.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : item.status === "REFUNDED"
                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700 font-mono text-[11px]">
                            {item.gateway ? <b className="text-slate-900">{item.gateway} · </b> : ""}
                            {item.transactionId || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{item.adminRemarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={Landmark}
                  title="No deposit transactions recorded"
                  text="Security deposit payments and refunds made by this rider will be logged in this ledger."
                />
              )}
            </Card>
          </div>
        )}

        {/* TAB 5: Delivery Orders */}
        {tab === "orders" && (
          <Card title="Order Delivery & Handover History">
            {data.recentOrders && data.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 bg-slate-50/80 border-b border-slate-100">
                      <th className="px-5 py-3.5 font-bold">Order #</th>
                      <th className="px-5 py-3.5 font-bold">Store / Vendor</th>
                      <th className="px-5 py-3.5 font-bold">Customer</th>
                      <th className="px-5 py-3.5 font-bold">Total Amount</th>
                      <th className="px-5 py-3.5 font-bold">Payment</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold">Date Placed</th>
                      <th className="px-5 py-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-black text-slate-900 font-mono">{ord.orderNumber}</td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-800">
                          {ord.vendor?.businessDetails?.businessName || ord.vendor?.name || "Store"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-semibold text-slate-800 block">{ord.customer?.name || "Customer"}</span>
                          {ord.customer?.phone && (
                            <span className="text-[10px] text-slate-400 block font-mono">{ord.customer.phone}</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-black text-slate-900 text-sm">{npr(ord.totalAmount)}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-bold text-slate-700">{ord.paymentMethod || "COD"}</span> ·{" "}
                          <span className="uppercase text-[10px] font-extrabold text-slate-500">{ord.paymentStatus || "PENDING"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Pill badge={orderStatusBadge(ord.orderStatus)} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-medium">{formatDateTime(ord.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`${base}/orders?search=${encodeURIComponent(ord.orderNumber)}`}
                            className={`${btn.outline} h-7 text-xs px-2.5 font-bold`}
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Bike}
                title="No completed delivery orders yet"
                text="Orders fulfilled by this partner will appear here once assigned and dispatched."
              />
            )}
          </Card>
        )}
      </div>

      {/* MODAL: Change Approval Status */}
      {statusModalOpen && (
        <Modal
          open
          title={`Update Status · ${p.fullName}`}
          onClose={() => setStatusModalOpen(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className={btn.ghost}
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className={btn.primary}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Saving…" : "Save Status"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Select New Approval Status</label>
              <div className="grid grid-cols-1 gap-2 pt-1">
                {[
                  { key: "APPROVED", label: "APPROVED", desc: "Active & eligible to go online and accept delivery dispatches." },
                  { key: "PENDING_APPROVAL", label: "PENDING_APPROVAL", desc: "Under initial onboarding or document review." },
                  { key: "SUSPENDED", label: "SUSPENDED", desc: "Temporarily blocked from receiving store dispatch orders." },
                  { key: "REJECTED", label: "REJECTED", desc: "Application or identity rejected by platform admin." },
                  { key: "DEACTIVATED", label: "DEACTIVATED", desc: "Permanently closed rider account." },
                ].map((s) => (
                  <label
                    key={s.key}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                      newStatus === s.key ? "bg-sky-50/80 border-[#0284C7] ring-1 ring-[#0284C7]" : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="approvalStatus"
                      value={s.key}
                      checked={newStatus === s.key}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="mt-0.5 w-4 h-4 accent-[#0284C7]"
                    />
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block">{s.label}</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">{s.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={fieldLabel}>Audit Remarks / Administrative Notes</label>
              <textarea
                className={`${field} h-20 py-2`}
                placeholder="Reason or notes regarding this status change (saved to audit logs)…"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Review Document */}
      {reviewingDoc && (
        <Modal
          open
          title={`Review Document · ${reviewingDoc.name}`}
          onClose={() => setReviewingDoc(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setReviewingDoc(null)}
                className={btn.ghost}
                disabled={updatingDoc}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewDoc}
                className={docNewStatus === "REJECTED" ? btn.danger : btn.primary}
                disabled={updatingDoc}
              >
                {updatingDoc ? "Saving…" : "Submit Review"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Verification Decision</label>
              <select
                className={field}
                value={docNewStatus}
                onChange={(e) => setDocNewStatus(e.target.value)}
              >
                <option value="VERIFIED">VERIFIED (Valid and approved)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Requires further inspection)</option>
                <option value="RESUBMISSION_REQUIRED">RESUBMISSION_REQUIRED (Ask partner to re-upload clear copy)</option>
                <option value="REJECTED">REJECTED (Invalid or falsified document)</option>
              </select>
            </div>

            {docNewStatus === "REJECTED" && (
              <div>
                <label className={fieldLabel}>Rejection Reason *</label>
                <input
                  className={field}
                  placeholder="e.g. Expired license or blurred photo"
                  value={docRejectionReason}
                  onChange={(e) => setDocRejectionReason(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className={fieldLabel}>Auditor Comments (Optional)</label>
              <textarea
                className={`${field} h-20 py-2`}
                placeholder="Internal audit remarks visible to other admins…"
                value={docReviewerComments}
                onChange={(e) => setDocReviewerComments(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Full Image Lightbox */}
      {previewImage && (
        <Modal
          open
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
          wide
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btn.outline} text-xs h-9`}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className={`${btn.primary} h-9 text-xs`}
              >
                Done
              </button>
            </div>
          }
        >
          <div className="flex items-center justify-center p-2 bg-slate-950 rounded-2xl overflow-hidden max-h-[70vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
            />
          </div>
        </Modal>
      )}
    </>
  );
}

/** Interactive Leaflet Mini-Map Component for the Partner's Live Location */
function RiderMiniMap({
  lat,
  lng,
  partnerName,
  zoneArea,
  availability,
  isBusy,
}: {
  lat: number;
  lng: number;
  partnerName: string;
  zoneArea: string;
  availability?: string;
  isBusy?: boolean;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const Lf = (mod as unknown as { default?: typeof L }).default || (mod as unknown as typeof L);
      if (cancelled || !mapEl.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = Lf.map(mapEl.current, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 13);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Coverage radius (5km)
      Lf.circle([lat, lng], {
        radius: 5000,
        color: "#0284C7",
        weight: 1.5,
        fillColor: "#0284C7",
        fillOpacity: 0.08,
      }).addTo(map);

      // Rider marker
      const fillColor = isBusy ? "#F59E0B" : availability === "ONLINE" ? "#10B981" : "#94A3B8";
      Lf.circleMarker([lat, lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor,
        fillOpacity: 1,
      })
        .bindPopup(
          `<b>${partnerName}</b><br/>Zone: ${zoneArea}<br/>Status: ${isBusy ? "On Delivery" : availability === "ONLINE" ? "Online" : "Offline"}`
        )
        .addTo(map)
        .openPopup();

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, partnerName, zoneArea, availability, isBusy]);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm z-0">
      <div ref={mapEl} className="w-full h-full" />
    </div>
  );
}
