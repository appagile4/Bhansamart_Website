"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  HardDrive,
  Images,
  Info,
  Landmark,
  Layers,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import * as api from "@/lib/seller/api";
import type { StoragePlan, StorageRecharge } from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import { formatDateTime } from "@/lib/seller/format";
import { STORAGE_KIND_LABEL, formatStorage, storageLevel, useStorageUsage } from "@/lib/seller/storage";
import { Card, EmptyState, ErrorBanner, LoadingBlock, Modal, PageHeader, SuccessBanner, btn, field, fieldLabel } from "@/components/vendor/ui";

const KIND_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  product: { bg: "bg-sky-500", dot: "bg-sky-500", label: "Product photos" },
  logo: { bg: "bg-violet-500", dot: "bg-violet-500", label: "Store logo" },
  qr: { bg: "bg-emerald-500", dot: "bg-emerald-500", label: "Payment QR" },
  brand: { bg: "bg-amber-500", dot: "bg-amber-500", label: "Brand logos" },
  other: { bg: "bg-slate-400", dot: "bg-slate-400", label: "Other assets" },
};

export default function SellerStoragePage() {
  const usage = useStorageUsage();
  const plans = useAsync(() => api.getStoragePlans(), "storage-plans");
  const history = useAsync(() => api.getMyStorageRecharges(), "storage-recharges");
  const [choosing, setChoosing] = useState<StoragePlan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const d = usage.data;
  const level = storageLevel(d?.percent);
  const pending = d?.pendingRecharge || null;

  return (
    <>
      <PageHeader
        title="Storage & Recharge"
        subtitle="Space used by your product photos, store logo, payment QR and brand logos"
      />
      <div className="space-y-5">
        {notice && <SuccessBanner message={notice} />}
        {usage.error && !d && <ErrorBanner message={usage.error} onRetry={usage.reload} />}

        {/* Hero Storage Usage Overview Card */}
        <Card>
          {!d ? (
            <LoadingBlock text="Loading storage usage…" />
          ) : (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Top Banner Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      level >= 100
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : level >= 80
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-sky-50 text-sky-600 border border-sky-200"
                    }`}
                  >
                    <HardDrive className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        {formatStorage(d.usedBytes)}
                      </p>
                      <span className="text-slate-400 text-sm font-semibold">
                        of {formatStorage(d.quotaBytes)} total quota
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{formatStorage(d.freeBytes)} remaining capacity</span>
                      <span>·</span>
                      <span>{d.assetCount} media files stored</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider ${
                      level >= 100
                        ? "bg-red-100 text-red-700 border border-red-300"
                        : level >= 90
                        ? "bg-orange-100 text-orange-800 border border-orange-300"
                        : level >= 80
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {level >= 100 ? "Storage Full (100%)" : `${d.percent}% Used`}
                  </span>
                </div>
              </div>

              {/* Multi-Segmented Storage Bar */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {d.breakdown.map((b) => {
                    const pct = d.quotaBytes > 0 ? (b.bytes / d.quotaBytes) * 100 : 0;
                    if (pct <= 0) return null;
                    const col = KIND_COLORS[b.kind] || KIND_COLORS.other;
                    return (
                      <div
                        key={b.kind}
                        style={{ width: `${pct}%` }}
                        className={`${col.bg} transition-all duration-500`}
                        title={`${STORAGE_KIND_LABEL[b.kind] || b.kind}: ${formatStorage(b.bytes)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Storage Segment Legend */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    {d.breakdown.map((b) => {
                      const col = KIND_COLORS[b.kind] || KIND_COLORS.other;
                      return (
                        <span key={b.kind} className="inline-flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                          <span>{STORAGE_KIND_LABEL[b.kind] || b.kind}</span>
                          <span className="text-slate-400">({formatStorage(b.bytes)})</span>
                        </span>
                      );
                    })}
                    <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <span>Free Space</span>
                      <span className="text-slate-400">({formatStorage(d.freeBytes)})</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Max Quota: {formatStorage(d.quotaBytes)}
                  </span>
                </div>
              </div>

              {/* Alert Status Banners */}
              {level >= 100 ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-800 flex-1">
                    <p className="font-extrabold text-sm text-red-900">Uploads are currently blocked</p>
                    <p className="mt-0.5">
                      Your store has reached its storage capacity limit.{" "}
                      {pending
                        ? "Your recharge request is currently waiting for admin verification."
                        : "Select an instant recharge plan below to increase your quota and resume uploading product photos."}
                    </p>
                  </div>
                </div>
              ) : level >= 80 ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold">Storage warning: </span>
                    You have used {d.percent}% of your allocated media storage. Consider recharging below to ensure smooth product catalog management.
                  </div>
                </div>
              ) : null}

              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Used Space</span>
                  <span className="text-base font-extrabold text-slate-900 block mt-0.5">{formatStorage(d.usedBytes)}</span>
                  <span className="text-[10px] text-slate-400">{d.percent}% of total quota</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Free Available</span>
                  <span className="text-base font-extrabold text-emerald-600 block mt-0.5">{formatStorage(d.freeBytes)}</span>
                  <span className="text-[10px] text-slate-400">Ready for uploads</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Media</span>
                  <span className="text-base font-extrabold text-sky-600 block mt-0.5">{d.assetCount} images</span>
                  <span className="text-[10px] text-slate-400">Stored on Cloud CDN</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Pending Recharge Banner */}
        {pending && (
          <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-amber-900 text-sm">Recharge Awaiting Verification</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    In Review
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Plan: <strong>{pending.planName}</strong> · Amount: <strong>{pending.currency} {pending.amount.toLocaleString()}</strong> · Ref:{" "}
                  <code className="bg-white/80 px-1.5 py-0.5 rounded text-amber-950 font-bold">{pending.paymentRef || "Not provided"}</code>
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Requested {formatDateTime(pending.createdAt)}. The BhansaMart administration team will verify and activate your extra storage shortly.
                </p>
              </div>
            </div>
            <div className="self-end sm:self-center">
              <span className="text-xs font-bold text-amber-800 bg-white border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Pending Admin Approval
              </span>
            </div>
          </div>
        )}

        {/* Storage Plans Tier Cards (Pricing & Boosts) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recharge & Boost Storage</h2>
              <p className="text-xs text-slate-500">One-time storage boosts with lifetime validity. Never expires.</p>
            </div>
            <span className="text-xs text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> High-Speed Cloudflare / Cloudinary CDN
            </span>
          </div>

          {plans.error && <ErrorBanner message={plans.error} onRetry={plans.reload} />}

          {!plans.data ? (
            !plans.error && <LoadingBlock text="Loading storage recharge plans…" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.data.plans.map((p, idx) => {
                const isPopular = idx === 1;
                const extraGb = Math.round(p.extraBytes / (1024 ** 3));
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all duration-200 relative ${
                      isPopular
                        ? "border-sky-500 bg-gradient-to-b from-sky-50/40 via-white to-white shadow-md shadow-sky-100"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                        ★ Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {extraGb <= 5 ? "Starter Pack" : extraGb <= 10 ? "Business Pro" : "Enterprise"}
                        </span>
                        <span className="text-xs font-black text-sky-700 bg-sky-100/70 px-2.5 py-0.5 rounded-full">
                          +{extraGb} GB
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">{p.name}</h3>

                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-xs font-bold text-slate-500">{p.currency}</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {p.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/ one-time</span>
                      </div>

                      <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Adds <strong>{formatStorage(p.extraBytes)}</strong> permanent space</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>High-speed Global Cloud CDN</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Lifetime validity (no monthly renewal)</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={Boolean(pending)}
                        onClick={() => setChoosing(p)}
                        className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isPopular
                            ? "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white shadow-sm"
                            : "bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        {pending ? "Recharge in Review" : "Recharge Now"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Media Breakdown & Largest Files */}
        {d && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution */}
            <Card title="Storage by Media Category">
              <div className="p-5 space-y-3.5">
                {d.breakdown.length === 0 ? (
                  <p className="text-sm text-slate-500">No images counted yet.</p>
                ) : (
                  d.breakdown.map((b) => {
                    const col = KIND_COLORS[b.kind] || KIND_COLORS.other;
                    const pct = d.usedBytes > 0 ? (b.bytes / d.usedBytes) * 100 : 0;
                    return (
                      <div key={b.kind} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                            {STORAGE_KIND_LABEL[b.kind] || b.kind}
                            <span className="text-slate-400 font-normal">· {b.count} files</span>
                          </span>
                          <span className="text-slate-600 font-extrabold">
                            {formatStorage(b.bytes)}{" "}
                            <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className={`h-full ${col.bg} rounded-full`} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Largest Assets Gallery */}
            <Card title="Largest Stored Files">
              <div className="p-4">
                {d.largest.length === 0 ? (
                  <EmptyState icon={Images} title="No uploaded images found" />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                    {d.largest.slice(0, 10).map((a) => (
                      <a
                        key={a._id}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group block rounded-xl border border-slate-200 overflow-hidden hover:border-sky-500 hover:shadow-sm transition-all"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.url}
                          alt=""
                          loading="lazy"
                          className="w-full aspect-square object-cover bg-slate-100 group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="p-1 bg-white text-center border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-700 block truncate">
                            {formatStorage(a.bytes)}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Recharge History Table */}
        <Card title="Storage Recharge History">
          {history.loading && !history.data ? (
            <LoadingBlock text="Loading recharge requests…" />
          ) : history.error ? (
            <div className="p-4">
              <ErrorBanner message={history.error} onRetry={history.reload} />
            </div>
          ) : !history.data?.length ? (
            <EmptyState icon={Clock} title="No recharge requests submitted yet" />
          ) : (
            <div className="divide-y divide-slate-100">
              {history.data.map((r) => (
                <HistoryRow key={r._id} r={r} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Interactive Recharge Modal with Real Payment Methods */}
      {choosing && (
        <RechargeModal
          plan={choosing}
          onClose={() => setChoosing(null)}
          onDone={(m) => {
            setChoosing(null);
            setNotice(m);
            usage.reload();
            history.reload();
          }}
        />
      )}
    </>
  );
}

function HistoryRow({ r }: { r: StorageRecharge }) {
  const pending = r.status === "PENDING" || r.status === "PAID";
  const Icon = pending ? Clock : r.status === "APPROVED" ? CheckCircle2 : XCircle;
  const tone = pending
    ? "text-amber-600 bg-amber-50 border-amber-200"
    : r.status === "APPROVED"
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tone}`}>
          <Icon className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm text-slate-900">{r.planName}</span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone}`}
            >
              {pending ? "Awaiting Verification" : r.status === "APPROVED" ? "Approved" : "Rejected"}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            {formatDateTime(r.createdAt)}
            {r.paymentRef ? (
              <>
                {" "}· Reference: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-bold">{r.paymentRef}</code>
              </>
            ) : null}
          </p>

          {r.status === "APPROVED" && r.quotaAfter ? (
            <p className="text-xs font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Total store limit upgraded to {formatStorage(r.quotaAfter)}
            </p>
          ) : null}

          {r.adminNote && (
            <p
              className={`text-xs mt-1 p-2 rounded-lg border ${
                r.status === "REJECTED" ? "bg-red-50 border-red-200 text-red-800" : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <strong>{r.status === "REJECTED" ? "Rejection Reason" : "Admin Note"}:</strong> {r.adminNote}
            </p>
          )}
        </div>
      </div>

      <div className="sm:text-right shrink-0">
        <span className="text-sm font-black text-slate-900 block">
          {r.currency} {r.amount.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400 block font-medium">+{formatStorage(r.extraBytes)} Storage</span>
      </div>
    </div>
  );
}

function CopyPill({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
      title={`Copy ${label}`}
    >
      <span>{value}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
    </button>
  );
}

function RechargeModal({
  plan,
  onClose,
  onDone,
}: {
  plan: StoragePlan;
  onClose: () => void;
  onDone: (m: string) => void;
}) {
  const [paymentRef, setPaymentRef] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<"wallet" | "bank" | "qr">("wallet");

  const [treasury, setTreasury] = useState({
    bankName: "Nepal Investment Mega Bank",
    accountHolderName: "BhansaMart Logistics Pvt. Ltd.",
    accountNumber: "01901020003456",
    branchName: "Kathmandu Central",
    ifscOrRoutingCode: "NIMBNPKA",
    upiId: "bhansamart@nimbl",
    esewaId: "9801234567",
    khaltiId: "9801234567",
  });

  // Load platform treasury configuration dynamically
  useEffect(() => {
    fetch("/api/checkout/payment-methods")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const b = data.data.bankDetails || {};
          const pms = data.data.paymentMethods || [];
          const esewa = pms.find((m: any) => m.methodKey === "esewa");
          const khalti = pms.find((m: any) => m.methodKey === "khalti");
          const upi = pms.find((m: any) => m.methodKey === "upi");

          setTreasury((prev) => ({
            ...prev,
            bankName: b.bankName || prev.bankName,
            accountHolderName: b.accountHolderName || prev.accountHolderName,
            accountNumber: b.accountNumber || prev.accountNumber,
            branchName: b.branchName || prev.branchName,
            ifscOrRoutingCode: b.ifscOrRoutingCode || prev.ifscOrRoutingCode,
            upiId: upi?.accountIdentifier || b.upiId || prev.upiId,
            esewaId: esewa?.accountIdentifier || prev.esewaId,
            khaltiId: khalti?.accountIdentifier || prev.khaltiId,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  const submit = async () => {
    if (!paymentRef.trim()) {
      return setError("Please enter your payment reference, UTR, or transaction ID so we can verify your deposit.");
    }
    setBusy(true);
    setError(null);
    try {
      const r = await api.requestStorageRecharge({
        planId: plan.id,
        paymentRef: paymentRef.trim(),
        note: note.trim() || undefined,
      });
      onDone(r.message || "Recharge request submitted successfully.");
    } catch (e) {
      setError(api.errorText(e, "Could not submit the recharge request."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      wide
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <Zap className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Recharge Store Storage</h2>
            <p className="text-xs text-slate-500 font-normal">Transfer payment to BhansaMart treasury to activate extra quota.</p>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Total to pay: <span className="font-extrabold text-slate-900">{plan.currency} {plan.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !paymentRef.trim()}
              onClick={submit}
              className={`${btn.primary} bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50`}
            >
              {busy ? "Submitting…" : "Submit for Verification"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        {/* Selected Plan Summary Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50/60 to-emerald-50/50 border border-sky-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-base">{plan.name}</p>
              <p className="text-xs text-slate-600">
                Adds <strong>{formatStorage(plan.extraBytes)}</strong> permanent space to your store
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-semibold">Total Price</span>
            <span className="text-xl font-black text-sky-700 block">
              {plan.currency} {plan.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Step 1: Payment Instructions with Real Bank & Wallet Tabs */}
        <div>
          <span className={fieldLabel}>1. Select Payment Method to Send {plan.currency} {plan.amount.toLocaleString()}</span>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            <button
              type="button"
              onClick={() => setActiveChannel("wallet")}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeChannel === "wallet"
                  ? "border-sky-500 bg-sky-50/70 text-sky-800 shadow-xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>eSewa / Khalti</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel("bank")}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeChannel === "bank"
                  ? "border-sky-500 bg-sky-50/70 text-sky-800 shadow-xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Landmark className="w-4 h-4 text-sky-600" />
              <span>Direct Bank</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveChannel("qr")}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeChannel === "qr"
                  ? "border-sky-500 bg-sky-50/70 text-sky-800 shadow-xs"
                  : "border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="w-4 h-4 text-violet-600" />
              <span>Fonepay / QR</span>
            </button>
          </div>

          {/* Payment Detail Box */}
          <div className="mt-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/90 text-xs text-slate-700 space-y-2">
            {activeChannel === "wallet" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">eSewa Merchant ID:</span>
                  <CopyPill value={treasury.esewaId} label="eSewa ID" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Khalti Wallet ID:</span>
                  <CopyPill value={treasury.khaltiId} label="Khalti ID" />
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Open your eSewa or Khalti app, send <strong>NPR {plan.amount}</strong> to the ID above, and quote your Store Name in remarks.
                </p>
              </div>
            )}

            {activeChannel === "bank" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-bold text-slate-900">{treasury.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <CopyPill value={treasury.accountHolderName} label="Account Name" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <CopyPill value={treasury.accountNumber} label="Account Number" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Branch & Routing:</span>
                  <span className="font-medium text-slate-700">
                    {treasury.branchName} · IFSC: <CopyPill value={treasury.ifscOrRoutingCode} label="IFSC Code" />
                  </span>
                </div>
              </div>
            )}

            {activeChannel === "qr" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fonepay / Direct UPI:</span>
                  <CopyPill value={treasury.upiId} label="UPI / Fonepay ID" />
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Scan merchant QR code with any Nepalese mobile banking app (Nabil, NIMB, Global IME, etc.) and complete transfer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Payment Reference / Transaction ID Input */}
        <div>
          <span className={fieldLabel}>2. Enter Transaction ID / Payment Reference *</span>
          <input
            className={`${field} h-10`}
            value={paymentRef}
            maxLength={100}
            onChange={(e) => {
              setPaymentRef(e.target.value);
              setError(null);
            }}
            placeholder="e.g. ESEWA-992834 or UTR-202410312389"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Found on your bank transfer receipt, SMS confirmation, or digital wallet payment history.
          </p>
        </div>

        {/* Step 3: Optional Notes */}
        <div>
          <span className={fieldLabel}>3. Notes / Remarks (Optional)</span>
          <textarea
            className={`${field} h-16 py-2 text-xs`}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Paid via eSewa from account 98XXXXXXXX"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
