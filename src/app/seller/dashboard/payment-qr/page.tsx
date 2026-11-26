"use client";

import React, { useState } from "react";
import { ALLOWED_IMAGE_LABEL, IMAGE_ACCEPT, MAX_IMAGE_LABEL, imageSizeError, minSizeLabel, validateImageFile } from "@/lib/imageUpload";
import { BadgeCheck, ImagePlus, QrCode, Trash2 } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { PaymentQrSettings } from "@/lib/seller/types";
import { Card, ErrorBanner, LoadingBlock, PageHeader, SuccessBanner, btn, field, fieldLabel } from "@/components/vendor/ui";
import { StorageFullHint } from "@/components/vendor/StorageWidgets";
import { useImageCrop } from "@/components/ImageCropper";

export default function PaymentQrPage() {
  const { data, error, loading, reload } = useAsync(() => api.getPaymentQr(), "qr");
  const [notice, setNotice] = useState<string | null>(null);
  if (loading && !data) return <LoadingBlock text="Loading payment settings…" />;
  if (!data) return <ErrorBanner message={error || "Could not load payment settings."} onRetry={reload} />;
  // key: re-initialise the form when the QR image changes on the server (upload / remove)
  return <PaymentQrForm key={data.qrCodeUrl || "none"} initial={data} notice={notice} setNotice={setNotice} onSaved={reload} />;
}

function PaymentQrForm({
  initial,
  notice,
  setNotice,
  onSaved,
}: {
  initial: PaymentQrSettings;
  notice: string | null;
  setNotice: (m: string | null) => void;
  onSaved: () => void;
}) {
  const [acceptQr, setAcceptQr] = useState(initial.acceptQrPayments);
  const [upiId, setUpiId] = useState(initial.upiId);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [busy, setBusy] = useState<null | "save" | "upload" | "remove">(null);
  const [error, setError] = useState<string | null>(null);
  const { cropImage, cropDialog } = useImageCrop();

  const run = async (kind: "save" | "upload" | "remove", fn: () => Promise<unknown>, success: string) => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(success);
      onSaved();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const invalid = validateImageFile(f) || (await imageSizeError(f, "qr"));
    if (invalid) return setError(invalid);
    const cropped = await cropImage(f, "qr");
    if (!cropped) return;
    run("upload", () => api.uploadPaymentQrImage(cropped), "QR code uploaded. QR payments are now enabled for your store.");
  };

  const save = () => {
    if (acceptQr && !upiId.trim() && !initial.qrCodeUrl) {
      setError("Upload a QR code or enter a UPI ID before enabling QR payments.");
      return;
    }
    if (upiId.trim() && !/^[\w.\-]{2,}@[\w.\-]{2,}$|^\d{10}$/.test(upiId.trim())) {
      setError("Enter a valid UPI ID (e.g. yourstore@okhdfcbank) or a 10-digit wallet number.");
      return;
    }
    run("save", () => api.updatePaymentQr({ upiId: upiId.trim(), accountName: accountName.trim(), acceptQrPayments: acceptQr }), "Payment QR settings saved.");
  };

  return (
    <>
      {cropDialog}
      <PageHeader backHref="/seller/dashboard/transactions" title="Store Payment QR & UPI" subtitle="Let customers pay your store directly by scanning your QR code at delivery." />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {notice && <div className="xl:col-span-2"><SuccessBanner message={notice} /></div>}
        {error && <div className="xl:col-span-2 space-y-2"><ErrorBanner message={error} /><StorageFullHint error={error} /></div>}

        <Card className="xl:col-span-2">
          <button type="button" role="switch" aria-checked={acceptQr} onClick={() => setAcceptQr((v) => !v)} className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer">
            <div>
              <p className="text-sm font-extrabold text-vendor-dark">Accept QR & UPI Payments</p>
              <p className="text-xs text-slate-500 mt-0.5">Customers will see &ldquo;Vendor QR Code (Direct)&rdquo; as a payment option. Save to apply.</p>
            </div>
            <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${acceptQr ? "bg-vendor-done" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${acceptQr ? "left-5.5" : "left-0.5"}`} />
            </span>
          </button>
        </Card>

        <Card
          title="Store QR Code"
          action={
            initial.qrCodeUrl ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <BadgeCheck className="w-3.5 h-3.5" /> Cloudinary Verified
              </span>
            ) : null
          }
        >
          <div className="p-5 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
              {initial.qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initial.qrCodeUrl} alt="Store payment QR code" className="w-full h-full object-contain bg-white" />
              ) : (
                <QrCode className="w-16 h-16 text-slate-300" />
              )}
            </div>
            <div className="space-y-3 text-center sm:text-left">
              <p className="text-xs text-slate-600">Upload the QR from your bank, eSewa, Khalti or Fonepay app. You can crop a screenshot after choosing it.</p>
              <p className="text-[11px] text-slate-500">
                {ALLOWED_IMAGE_LABEL} · max {MAX_IMAGE_LABEL} · {minSizeLabel("qr")}
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <label className={`${btn.primary} ${busy === "upload" ? "opacity-60 pointer-events-none" : ""}`}>
                  <ImagePlus className="w-4 h-4" /> {busy === "upload" ? "Uploading…" : initial.qrCodeUrl ? "Replace QR" : "Upload QR"}
                  <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={onPick} disabled={busy !== null} />
                </label>
                {initial.qrCodeUrl && (
                  <button type="button" disabled={busy !== null} onClick={() => run("remove", () => api.updatePaymentQr({ qrCodeUrl: "" }), "QR code removed.")} className={btn.danger}>
                    <Trash2 className="w-4 h-4" /> {busy === "remove" ? "Removing…" : "Remove"}
                  </button>
                )}
              </div>
              {initial.upiId && (
                <p className="text-xs text-slate-600">
                  Active UPI ID: <span className="font-bold text-slate-900">{initial.upiId}</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card title="UPI & Account Details">
          <div className="p-5 space-y-4">
            <label className="block">
              <span className={fieldLabel}>Store UPI ID / VPA</span>
              <input className={field} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="e.g. yourstore@okhdfcbank or 9800000000@paytm" />
            </label>
            <label className="block">
              <span className={fieldLabel}>Payee / Account Name</span>
              <input className={field} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. Bhansa Grocery Store" />
            </label>
            <button type="button" disabled={busy !== null} onClick={save} className={`${btn.primary} w-full sm:w-auto`}>
              {busy === "save" ? "Saving…" : "Save Payment QR Settings"}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
}
