"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ALLOWED_IMAGE_LABEL,
  IMAGE_ACCEPT,
  MAX_IMAGE_LABEL,
  validateImageFile,
} from "@/lib/imageUpload";
import { ImagePlus } from "lucide-react";
import * as api from "@/lib/seller/api";
import { MAIN_CATEGORY_NAMES } from "@/lib/constants/categories";
import { Modal, btn, field, fieldLabel } from "./ui";
import { StorageFullHint } from "@/components/vendor/StorageWidgets";

/** App: components/VendorComponent/AddBrandModal.tsx — request a new brand for admin approval */
export default function BrandRequestModal({
  open,
  onClose,
  onSubmitted,
  defaultCategory,
  defaultName = "",
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  defaultCategory?: string;
  defaultName?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>(
    defaultCategory ? [defaultCategory] : [],
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local preview for an uploaded logo; the object URL is released when it changes
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : ""),
    [logoFile],
  );
  useEffect(
    () => () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    },
    [logoPreview],
  );

  const reset = () => {
    setName(defaultName);
    setDescription("");
    setCategories(defaultCategory ? [defaultCategory] : []);
    setLogoFile(null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggleCat = (c: string) =>
    setCategories((cur) =>
      cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c],
    );

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const invalid = validateImageFile(f);
    if (invalid) return setError(invalid);
    setError(null);
    setLogoFile(f);
  };

  const submit = async () => {
    if (!name.trim()) return setError("Brand name is required.");
    if (!categories.length)
      return setError("Select at least one category for this brand.");
    if (!logoFile) return setError("Please upload the brand logo image.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.createBrandRequest({
        name: name.trim(),
        categories,
        description: description.trim() || undefined,
        logoFile,
      });
      onSubmitted(
        r.message || `Brand "${name.trim()}" submitted for approval.`,
      );
      reset();
      onClose();
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const preview = logoPreview;

  return (
    <Modal
      open={open}
      title="Request a New Brand"
      onClose={close}
      wide
      footer={
        <>
          <button type="button" onClick={close} className={btn.ghost}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className={btn.primary}
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          New brands are reviewed by the BhansaMart team before they appear for
          everyone.
        </p>
        <label className="block">
          <span className={fieldLabel}>Brand name *</span>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amul, Nestlé, Everest"
          />
        </label>

        <div>
          <span className={fieldLabel}>Categories *</span>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORY_NAMES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                aria-pressed={categories.includes(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${
                  categories.includes(c)
                    ? "bg-vendor-dark border-vendor-dark text-white"
                    : "bg-white border-slate-300 text-slate-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Brand logo *</span>
          <div className="flex items-start gap-4">
            <span className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Logo preview"
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <ImagePlus className="w-6 h-6 text-slate-300" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2">
                <label className={btn.outline}>
                  <ImagePlus className="w-4 h-4" /> Choose image
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={pickFile}
                  />
                </label>
                <span className="w-full text-[11px] text-slate-500">
                  {ALLOWED_IMAGE_LABEL} · max {MAX_IMAGE_LABEL}
                </span>
                {preview && (
                  <button
                    type="button"
                    onClick={() => setLogoFile(null)}
                    className={btn.ghost}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <label className="block">
          <span className={fieldLabel}>Description</span>
          <textarea
            className={`${field} h-20 py-2`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief information about this brand..."
          />
        </label>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <StorageFullHint error={error} />
      </div>
    </Modal>
  );
}
