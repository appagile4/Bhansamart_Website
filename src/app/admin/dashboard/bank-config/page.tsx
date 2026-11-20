"use client";

import React, { useState } from "react";
import { Landmark, Save } from "lucide-react";
import * as api from "@/lib/admin/api";
import type { PaymentMethodConfig, PlatformPaymentConfig } from "@/lib/admin/api";
import { useAsync } from "@/lib/seller/useAsync";
import { Card, ErrorBanner, LoadingBlock, PageHeader, SuccessBanner, btn, field, fieldLabel } from "@/components/admin/ui";

/** Defaults & fixed copy exactly as the app's bank-config.tsx builds them */
const METHOD_DEFAULTS: PaymentMethodConfig[] = [
  { methodKey: "cod", displayName: "Cash on Delivery (COD)", isEnabled: true, minAmount: 0, maxAmount: 10000, instructions: "" },
  { methodKey: "esewa", displayName: "eSewa Mobile Wallet", isEnabled: true, accountIdentifier: "", minAmount: 10, maxAmount: 50000, instructions: "" },
  { methodKey: "khalti", displayName: "Khalti Digital Wallet", isEnabled: true, accountIdentifier: "", minAmount: 10, maxAmount: 50000, instructions: "" },
  { methodKey: "upi", displayName: "Fonepay / UPI Direct QR", isEnabled: true, accountIdentifier: "", qrCodeImageUrl: "", minAmount: 10, maxAmount: 100000, instructions: "Scan merchant QR code with any mobile banking app." },
  { methodKey: "wallet", displayName: "BhansaMart Wallet Balance", isEnabled: true, minAmount: 0, maxAmount: 50000, instructions: "Use your platform wallet credits and referral cash rewards." },
  { methodKey: "card", displayName: "Credit / Debit Card", isEnabled: true, minAmount: 10, maxAmount: 100000, instructions: "Pay online via Visa, MasterCard or SCT debit cards." },
];
// Which fields the app lets the admin edit per method
const EDITABLE: Record<string, Array<"accountIdentifier" | "qrCodeImageUrl" | "minAmount" | "maxAmount" | "instructions">> = {
  cod: ["maxAmount", "instructions"],
  esewa: ["accountIdentifier", "minAmount", "maxAmount", "instructions"],
  khalti: ["accountIdentifier", "minAmount", "maxAmount", "instructions"],
  upi: ["accountIdentifier", "qrCodeImageUrl", "minAmount", "maxAmount"],
  wallet: ["maxAmount"],
  card: ["maxAmount"],
};
const FIELD_LABEL = { accountIdentifier: "Merchant / account ID", qrCodeImageUrl: "QR image URL", minAmount: "Min order (NPR)", maxAmount: "Max order (NPR)", instructions: "Customer instructions" };

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative w-10 h-6 rounded-full shrink-0 cursor-pointer transition-colors ${on ? "bg-sky-600" : "bg-slate-300"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-1"}`} />
    </button>
  )
}

export default function BankConfigPage() {
  const q = useAsync(() => api.getPaymentConfig(), "payment-config");
  if (q.loading && !q.data) return <LoadingBlock text="Loading platform configuration…" />;
  if (!q.data) return <ErrorBanner message={q.error || "Could not load configuration."} onRetry={q.reload} />;
  return <ConfigForm key={q.data.updatedAt || "cfg"} cfg={q.data} onSaved={q.reload} />;
}

function ConfigForm({ cfg, onSaved }: { cfg: PlatformPaymentConfig; onSaved: () => void }) {
  const b = cfg.bankDetails || {};
  const [bank, setBank] = useState({
    bankName: b.bankName || "",
    accountHolderName: b.accountHolderName || "",
    accountNumber: b.accountNumber || "",
    branchName: b.branchName || "",
    ifscOrRoutingCode: b.ifscOrRoutingCode || b.ifscCode || "",
    upiId: b.upiId || "",
    qrCodeImageUrl: b.qrCodeImageUrl || "",
    instructions: b.instructions || "",
  });
  const [bankActive, setBankActive] = useState(b.isActive !== false);
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(() =>
    METHOD_DEFAULTS.map((d) => {
      const found = cfg.enabledPaymentMethods?.find((m) => m.methodKey === d.methodKey || (d.methodKey === "card" && m.methodKey === "razorpay"));
      const legacy = cfg.paymentMethods?.[d.methodKey === "card" ? "razorpay" : d.methodKey];
      return {
        ...d,
        ...(found ? { ...found, methodKey: d.methodKey, displayName: d.displayName } : {}),
        isEnabled: found ? found.isEnabled !== false : legacy ? legacy.isEnabled !== false : d.isEnabled,
        maxAmount: found?.maxAmount || legacy?.maxOrderAmount || d.maxAmount,
      };
    })
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setM = (key: string, patch: Partial<PaymentMethodConfig>) => setMethods((ms) => ms.map((m) => (m.methodKey === key ? { ...m, ...patch } : m)));

  const save = async () => {
    if (!bank.bankName.trim() || !bank.accountNumber.trim() || !bank.accountHolderName.trim()) {
      return setError("Bank Name, Account Holder Name, and Account Number are mandatory for platform treasury operations.");
    }
    const trimmed = Object.fromEntries(Object.entries(bank).map(([k, v]) => [k, v.trim()])) as typeof bank;
    trimmed.ifscOrRoutingCode = trimmed.ifscOrRoutingCode.toUpperCase();
    const m = (k: string) => methods.find((x) => x.methodKey === k)!;
    const enabledPaymentMethods: PaymentMethodConfig[] = [
      ...methods.map((x) => ({ ...x, accountIdentifier: x.accountIdentifier?.trim(), instructions: x.instructions?.trim(), qrCodeImageUrl: x.qrCodeImageUrl?.trim() })),
      { methodKey: "bank_transfer", displayName: "Direct Bank Transfer", isEnabled: bankActive, accountIdentifier: trimmed.accountNumber, minAmount: 100, maxAmount: 500000, instructions: trimmed.instructions },
    ];
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api.updatePaymentConfig({
        bankDetails: { ...trimmed, isActive: bankActive },
        enabledPaymentMethods,
        paymentMethods: {
          cod: { isEnabled: m("cod").isEnabled, maxOrderAmount: Number(m("cod").maxAmount) || 10000 },
          razorpay: { isEnabled: m("card").isEnabled },
          wallet: { isEnabled: m("wallet").isEnabled },
        },
      });
      setNotice("Configuration published. Bank details, digital wallets and checkout gateways are now live on customer checkout.");
      onSaved();
    } catch (e) {
      setError(api.errorText(e, "Failed to update configuration"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Platform Bank & Limits"
        subtitle="Treasury account and the payment methods customers see at checkout."
        actions={<button type="button" disabled={busy} onClick={save} className={btn.primary}><Save className="w-4 h-4" /> {busy ? "Publishing…" : "Publish Configuration"}</button>}
      />
      <div className="space-y-4">
        {notice && <SuccessBanner message={notice} />}
        {error && <ErrorBanner message={error} />}
        <Card title="Platform treasury bank account" action={<span className="flex items-center gap-2 text-xs font-semibold text-slate-600">Direct bank transfer <Switch on={bankActive} onChange={setBankActive} label="Direct bank transfer" /></span>}>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(
              [
                ["bankName", "Bank name *"],
                ["accountHolderName", "Account holder name *"],
                ["accountNumber", "Account number *"],
                ["branchName", "Branch"],
                ["ifscOrRoutingCode", "IFSC / SWIFT / routing code"],
                ["upiId", "Primary UPI / Fonepay ID"],
                ["qrCodeImageUrl", "Bank QR image URL"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className={fieldLabel}>{label}</span>
                <input className={field} value={bank[k]} onChange={(e) => setBank((s) => ({ ...s, [k]: e.target.value }))} />
              </label>
            ))}
            <label className="block md:col-span-2 xl:col-span-3">
              <span className={fieldLabel}>Bank transfer instructions</span>
              <textarea className={`${field} h-20 py-2`} value={bank.instructions} onChange={(e) => setBank((s) => ({ ...s, instructions: e.target.value }))} />
            </label>
            {bank.qrCodeImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bank.qrCodeImageUrl} alt="Bank QR preview" className="w-32 h-32 object-contain rounded-xl border border-slate-200 bg-white" />
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Card key={m.methodKey} title={m.displayName} action={<Switch on={m.isEnabled} onChange={(v) => setM(m.methodKey, { isEnabled: v })} label={`Enable ${m.displayName}`} />}>
              <div className={`p-5 grid grid-cols-2 gap-3 ${m.isEnabled ? "" : "opacity-60"}`}>
                {EDITABLE[m.methodKey].map((f) => {
                  const numeric = f === "minAmount" || f === "maxAmount";
                  const wide = f === "instructions" || f === "qrCodeImageUrl" || f === "accountIdentifier";
                  return (
                    <label key={f} className={`block ${wide ? "col-span-2" : ""}`}>
                      <span className={fieldLabel}>{FIELD_LABEL[f]}</span>
                      <input
                        className={field}
                        inputMode={numeric ? "numeric" : undefined}
                        value={String(m[f] ?? "")}
                        onChange={(e) => setM(m.methodKey, { [f]: numeric ? (e.target.value.replace(/\D/g, "") === "" ? undefined : Number(e.target.value.replace(/\D/g, ""))) : e.target.value })}
                      />
                    </label>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
        <p className="text-xs text-slate-500 flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Changes apply to the customer checkout immediately after publishing.</p>
      </div>
    </>
  );
}
