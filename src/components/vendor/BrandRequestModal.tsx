"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ALLOWED_IMAGE_LABEL,
  IMAGE_ACCEPT,
  MAX_IMAGE_LABEL,
  validateImageFile,
} from "@/lib/imageUpload";
import { ImagePlus, Search } from "lucide-react";
import * as api from "@/lib/seller/api";
import type { BrandLogoResult } from "@/lib/seller/types";
import { Modal, btn, field, fieldLabel } from "./ui";
import { StorageFullHint } from "@/components/vendor/StorageWidgets";

/** App: components/VendorComponent/AddBrandModal.tsx — request a new brand for admin approval */
export default function BrandRequestModal({
  open,
  onClose,
  onSubmitted,
  defaultCategory,
  defaultName = "",
  availableCategories,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  defaultCategory?: string;
  defaultName?: string;
  availableCategories?: string[];
}) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>(
    defaultCategory ? [defaultCategory] : [],
  );
  const [logoMode, setLogoMode] = useState<"custom" | "search">("custom");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoQuery, setLogoQuery] = useState("");
  const [results, setResults] = useState<BrandLogoResult[]>([]);
  const [searching, setSearching] = useState(false);
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
    setLogoUrl("");
    setLogoQuery("");
    setResults([]);
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

  const searchLogos = async () => {
    const q = logoQuery.trim() || name.trim();
    if (!q) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await api.searchBrandLogos(q));
    } catch (e) {
      setError(api.errorText(e));
    } finally {
      setSearching(false);
    }
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const invalid = validateImageFile(f);
    if (invalid) return setError(invalid);
    setError(null);
    setLogoUrl("");
    setLogoFile(f);
  };

  const submit = async () => {
    if (!name.trim()) return setError("Brand name is required.");
    if (!categories.length)
      return setError("Select at least one category for this brand.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.createBrandRequest({
        name: name.trim(),
        categories,
        description: description.trim() || undefined,
        logoFile,
        logoUrl: logoFile ? undefined : logoUrl || undefined,
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

  const preview = logoFile ? logoPreview : logoUrl;

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
                  onClick={() => toggleCat(c)}
                  aria-pressed={categories.includes(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition ${
                    categories.includes(c)
                      ? "bg-vendor-dark border-vendor-dark text-white"
                      : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className={fieldLabel}>Brand logo</span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-3 max-w-xs">
            {(
              [
                ["custom", "Upload"],
                ["search", "Search logo"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setLogoMode(k)}
                aria-pressed={logoMode === k}
                className={`h-8 rounded-md text-xs font-bold cursor-pointer ${logoMode === k ? "bg-white text-vendor-dark shadow-sm" : "text-slate-500"}`}
              >
                {l}
              </button>
            ))}
          </div>

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
              {logoMode === "custom" ? (
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
                      onClick={() => {
                        setLogoFile(null);
                        setLogoUrl("");
                      }}
                      className={btn.ghost}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      className={field}
                      value={logoQuery}
                      onChange={(e) => setLogoQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), searchLogos())
                      }
                      placeholder="Brand domain or name (e.g. nestle.com)"
                    />
                    <button
                      type="button"
                      onClick={searchLogos}
                      disabled={searching}
                      className={btn.outline}
                      aria-label="Search logos"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  {results.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {results.map((r) => (
                        <button
                          key={r.logoUrl}
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoUrl(r.logoUrl);
                            if (!name.trim()) setName(r.name);
                          }}
                          title={r.name}
                          className={`w-14 h-14 rounded-lg border-2 bg-white overflow-hidden cursor-pointer ${logoUrl === r.logoUrl ? "border-vendor-dark" : "border-slate-200"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.logoUrl}
                            alt={r.name}
                            className="w-full h-full object-contain"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <p className="text-[11px] text-slate-400">
                      Search to pick an official logo.
                    </p>
                  )}
                  {searching && (
                    <p className="text-[11px] text-slate-500">Searching…</p>
                  )}
                </div>
              )}
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
