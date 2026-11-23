"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import * as api from "@/lib/seller/api";
import { Modal, btn, field, fieldLabel } from "./ui";

const TYPES = [
  { key: "single", label: "Single choice" },
  { key: "multiple", label: "Multiple choice" },
  { key: "text", label: "Free text" },
] as const;

/** App: components/VendorComponent/AddAttributeModal.tsx — create (or extend) a product attribute */
export default function AttributeModal({
  open,
  onClose,
  onSubmitted,
  defaultCategory,
  availableCategories,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  defaultCategory?: string;
  availableCategories?: string[];
}) {
  const [name, setName] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [values, setValues] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategory ? [defaultCategory] : []);
  const [type, setType] = useState<"single" | "multiple" | "text">("single");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setValueInput("");
    setValues([]);
    setCategories(defaultCategory ? [defaultCategory] : []);
    setType("single");
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const addValue = () => {
    const parts = valueInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setValues((cur) => Array.from(new Set([...cur, ...parts])));
    setValueInput("");
  };

  const submit = async () => {
    if (!name.trim()) return setError("Attribute name is required.");
    if (type !== "text" && values.length === 0) return setError("Add at least one value (e.g. Red, 1kg, Large).");
    setBusy(true);
    setError(null);
    try {
      const r = await api.createAttribute({ name: name.trim(), categories, values, type });
      onSubmitted(r.message || `Attribute "${name.trim()}" saved.`);
      reset();
      onClose();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Add Product Attribute"
      onClose={close}
      wide
      footer={
        <>
          <button type="button" onClick={close} className={btn.ghost}>
            Cancel
          </button>
          <button type="button" disabled={busy} onClick={submit} className={btn.primary}>
            {busy ? "Saving…" : "Submit"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">If the attribute already exists, the new values are added to it.</p>
        <label className="block">
          <span className={fieldLabel}>Attribute name *</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Color, Size, Flavor, Pack Size" />
        </label>

        <div>
          <span className={fieldLabel}>Type</span>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                aria-pressed={type === t.key}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${type === t.key ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Values {type !== "text" && "*"}</span>
          <div className="flex gap-2">
            <input
              className={field}
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue())}
              placeholder="e.g. Red, Blue, 1kg, Large"
            />
            <button type="button" onClick={addValue} className={btn.outline}>
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {values.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-vendor-soft text-vendor-dark text-xs font-semibold">
                  {v}
                  <button type="button" onClick={() => setValues((cur) => cur.filter((x) => x !== v))} className="p-0.5 rounded-full hover:bg-vendor-100 cursor-pointer" aria-label={`Remove ${v}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className={fieldLabel}>Applies to categories</span>
          {!availableCategories?.length ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 w-24 rounded-full bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategories((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))}
                  aria-pressed={categories.includes(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition ${
                    categories.includes(c) ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
