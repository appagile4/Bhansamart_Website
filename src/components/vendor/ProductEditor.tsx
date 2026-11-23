"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ALLOWED_IMAGE_LABEL, IMAGE_ACCEPT, MAX_IMAGE_LABEL, isUnpreviewableImage, partitionImageFiles } from "@/lib/imageUpload";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Plus, RefreshCw, Search, Sparkles, Trash2, X } from "lucide-react";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import type { ProductVariant, SellerCategory, SellerProduct } from "@/lib/seller/types";
import {
  DISCOUNT_CATEGORIES,
  GENERIC_BRAND,
  PRESET_BRANDS,
  SUPPLIER_OPTIONS,
  WEIGHT_UNITS,
  generateSku,
  subCategoriesFor,
} from "@/lib/seller/catalogPresets";
import BrandRequestModal from "./BrandRequestModal";
import AttributeModal from "./AttributeModal";
import { Card, ErrorBanner, PageHeader, SuccessBanner, btn, field, fieldLabel } from "./ui";
import { StorageFullHint } from "@/components/vendor/StorageWidgets";

type Photo = { kind: "existing"; url: string } | { kind: "new"; file: File; preview: string };
type StatusKey = "active" | "not_active" | "schedule";
type Variant = Required<Pick<ProductVariant, "type" | "weightUnit" | "weightValue" | "color">> & { id: string };

const MAX_PHOTOS = 10;

const statusKeyOf = (s?: string): StatusKey => {
  const v = (s || "Active").toLowerCase();
  if (v.includes("schedule")) return "schedule";
  if (v.includes("not") || v === "draft" || v === "archived") return "not_active";
  return "active";
};

const brandIdOf = (p: SellerProduct | null) => (p && typeof p.brandRef === "object" && p.brandRef ? p.brandRef._id : (p?.brandRef as string | undefined)) || null;

/** Add / edit product — app: Screens/vendorScreens/addProduct.tsx */
export default function ProductEditor({ initial }: { initial: SellerProduct | null }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  // Dynamic Categories from backend catalog
  const categoriesQ = useAsync(() => api.getCategories(), "categories");

  const categoriesList = useMemo<SellerCategory[]>(() => {
    if (categoriesQ.data && categoriesQ.data.length > 0) {
      return categoriesQ.data;
    }
    return [];
  }, [categoriesQ.data]);

  const categoryNames = useMemo(() => {
    return categoriesList.map((c) => c.name);
  }, [categoriesList]);

  // 1. General information
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [subCategory, setSubCategory] = useState(initial?.subCategory || "");
  const [supplierName, setSupplierName] = useState(initial?.supplierName || SUPPLIER_OPTIONS[0]);
  const [expirationDate, setExpirationDate] = useState(initial?.expirationDate ? String(initial.expirationDate).slice(0, 10) : "");
  const [brand, setBrand] = useState((typeof initial?.brandRef === "object" && initial.brandRef?.name) || initial?.brand || GENERIC_BRAND);
  const [brandId, setBrandId] = useState<string | null>(brandIdOf(initial));
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    initial?.attributes?.forEach((a) => {
      if (a.name) map[a.name] = a.values?.length ? a.values : a.value ? a.value.split(",").map((x) => x.trim()) : [];
    });
    return map;
  });

  // 2. Pricing
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [discountCategory, setDiscountCategory] = useState(initial?.discountCategory || DISCOUNT_CATEGORIES[0]);
  const [discountValue, setDiscountValue] = useState(initial?.discountValue ? String(initial.discountValue) : "");

  // 3. Variations
  const [variants, setVariants] = useState<Variant[]>(() =>
    initial?.variants?.length
      ? initial.variants.map((v, i) => ({
          id: v.id || String(i + 1),
          type: v.type || "Standard",
          weightUnit: v.weightUnit || "kg",
          weightValue: v.weightValue || "1",
          color: v.color || "",
        }))
      : [{ id: "1", type: "Standard", weightUnit: "kg", weightValue: "1", color: "Natural" }]
  );

  // 4. Inventory
  const [sku, setSku] = useState(initial?.sku || (category ? generateSku(category) : ""));
  const [stock, setStock] = useState(initial ? String(initial.stock ?? 0) : "50");
  const [reorderLevel, setReorderLevel] = useState(initial?.reorderLevel != null ? String(initial.reorderLevel) : "10");

  // 5. Status & visibility
  const [status, setStatus] = useState<StatusKey>(statusKeyOf(initial?.status));
  const [visibility, setVisibility] = useState({
    featured: Boolean(initial?.visibility?.isFeatured),
    bestSellers: initial ? Boolean(initial.visibility?.isBestSeller) : true,
    newArrivals: initial ? Boolean(initial.visibility?.isNewArrival) : true,
  });
  const [isReturnable, setIsReturnable] = useState(Boolean(initial?.isReturnable));
  const [returnWindowDays, setReturnWindowDays] = useState(String(initial?.returnWindowDays || 7));
  const [isReplaceable, setIsReplaceable] = useState(Boolean(initial?.isReplaceable));
  const [isRefundable, setIsRefundable] = useState(Boolean(initial?.isRefundable));

  // 6. Tags
  const [tags, setTags] = useState<string[]>(initial?.tags || ["Fresh", "Organic", "Pantry"]);
  const [tagInput, setTagInput] = useState("");

  // 7. Photos
  const [photos, setPhotos] = useState<Photo[]>(() => (initial?.images || []).map((im) => ({ kind: "existing" as const, url: im.url })));
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });
  // release preview object URLs when leaving the page
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => p.kind === "new" && URL.revokeObjectURL(p.preview));
    },
    []
  );

  const [brandModal, setBrandModal] = useState(false);
  const [attrModal, setAttrModal] = useState(false);
  const [submitting, setSubmitting] = useState<null | "publish" | "draft">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Selected category doc from dynamic categories
  const activeCategoryItem = useMemo(() => {
    if (!category) return null;
    return categoriesList.find(
      (c) => c.name.toLowerCase().trim() === category.toLowerCase().trim()
    );
  }, [categoriesList, category]);

  // Subcategories for the selected category
  const subCategories = useMemo<string[]>(() => {
    if (activeCategoryItem && Array.isArray(activeCategoryItem.subCategories)) {
      return activeCategoryItem.subCategories.map((s) => s.name);
    }
    return category ? subCategoriesFor(category) : [];
  }, [activeCategoryItem, category]);

  // Initialize category & subcategory once categories load (for new product)
  useEffect(() => {
    if (!isEdit && categoriesList.length > 0) {
      const match = categoriesList.find(
        (c) => c.name.toLowerCase().trim() === (category || "").toLowerCase().trim()
      );
      if (!category || !match) {
        const first = categoriesList[0];
        setCategory(first.name);
        const firstSub = first.subCategories?.[0]?.name || "";
        setSubCategory(firstSub);
        setSku((curr) => (!curr || curr.startsWith("BM-PROD-") ? generateSku(first.name) : curr));
      }
    }
  }, [categoriesList, isEdit, category]);

  // Brands & attributes for the chosen category
  const brandsQ = useAsync(() => api.getBrands({ category, limit: 100 }), `b-${category}`);
  const attrsQ = useAsync(() => api.getAttributes({ category }), `a-${category}`);

  const brandOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string | null; name: string; logo?: string }> = [];
    (brandsQ.data || [])
      .filter((b) => b.status === "APPROVED")
      .forEach((b) => {
        const key = b.name.toLowerCase().trim();
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ id: b._id, name: b.name, logo: b.logo });
      });
    (PRESET_BRANDS[category] || []).forEach((b) => {
      const key = b.name.toLowerCase().trim();
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ id: null, name: b.name, logo: b.logo });
    });
    const q = brandSearch.trim().toLowerCase();
    return q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;
  }, [brandsQ.data, category, brandSearch]);

  const changeCategory = (c: string) => {
    setCategory(c);
    const catItem = categoriesList.find(
      (item) => item.name.toLowerCase().trim() === c.toLowerCase().trim()
    );
    const subs = catItem?.subCategories?.map((s) => s.name) || subCategoriesFor(c);
    setSubCategory(subs[0] || "");
    setBrand(GENERIC_BRAND);
    setBrandId(null);
    setSelectedAttrs({});
    if (!isEdit) {
      setSku(generateSku(c));
    }
  };

  const toggleAttrValue = (attr: string, value: string, multiple: boolean) =>
    setSelectedAttrs((cur) => {
      const vals = cur[attr] || [];
      const next = vals.includes(value) ? vals.filter((v) => v !== value) : multiple ? [...vals, value] : [value];
      return { ...cur, [attr]: next };
    });

  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    // Shared rules: JPG / PNG / WebP / HEIC, max 5 MB each (same size limit as the backend)
    const { accepted, errors } = partitionImageFiles(files);
    const room = Math.max(0, MAX_PHOTOS - photos.length);
    if (accepted.length > room) errors.push(`Only ${MAX_PHOTOS} photos are allowed — ${accepted.length - room} photo(s) were not added.`);
    setPhotoErrors(errors);
    const added = accepted.slice(0, room);
    setPhotos((cur) => [...cur, ...added.map((file) => ({ kind: "new" as const, file, preview: URL.createObjectURL(file) }))]);
  };

  const removePhoto = (idx: number) => {
    setPhotoErrors([]);
    setPhotos((cur) => {
      const p = cur[idx];
      if (p?.kind === "new") URL.revokeObjectURL(p.preview);
      return cur.filter((_, i) => i !== idx);
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((cur) => [...cur, t]);
    setTagInput("");
  };

  const submit = async (asDraft: boolean) => {
    setError(null);
    setNotice(null);
    // Same validation as the app
    if (!name.trim()) return setError("Please enter a valid Product Name.");
    if (!description.trim()) return setError("Please provide a short Product Description.");
    const priceNum = parseFloat(price);
    if (!price.trim() || isNaN(priceNum) || priceNum < 0) return setError("Please enter a valid Base Price.");
    // No MRP field in the app: keep an existing product's original price, otherwise use the selling price
    const mrpNum = initial?.originalPrice && initial.originalPrice >= priceNum ? initial.originalPrice : priceNum;
    const stockNum = parseInt(stock, 10);
    if (!stock.trim() || isNaN(stockNum) || stockNum < 0) return setError("Please enter a valid stock quantity.");

    const effectiveStatus = asDraft ? "Draft" : status === "active" ? "Active" : status === "schedule" ? "Schedule" : "Not Active";

    const form = new FormData();
    form.append("name", name.trim());
    form.append("description", description.trim());
    form.append("shortDescription", description.trim().slice(0, 150));
    form.append("category", category);
    form.append("subCategory", subCategory || "");
    form.append("supplierName", supplierName || "");
    form.append("brand", brand || GENERIC_BRAND);
    if (brandId) form.append("brandRef", brandId);
    const attrs = Object.entries(selectedAttrs)
      .filter(([, vals]) => vals.length > 0)
      .map(([attrName, vals]) => ({
        attributeId: attrsQ.data?.find((a) => a.name === attrName)?._id,
        name: attrName,
        value: vals.join(", "),
        values: vals,
      }));
    form.append("attributes", JSON.stringify(attrs));
    form.append("expirationDate", expirationDate || "");
    form.append("price", String(priceNum));
    form.append("originalPrice", String(mrpNum));
    form.append("discountCategory", discountCategory);
    form.append("discountValue", discountValue ? String(parseFloat(discountValue) || 0) : "0");
    form.append("sku", sku.trim());
    form.append("stock", String(stockNum));
    form.append("reorderLevel", String(parseInt(reorderLevel, 10) || 5));
    form.append("unit", variants[0] ? `${variants[0].weightValue} ${variants[0].weightUnit}` : "1 kg");
    form.append("status", effectiveStatus);
    form.append(
      "visibility",
      JSON.stringify({ isFeatured: visibility.featured, isBestSeller: visibility.bestSellers, isNewArrival: visibility.newArrivals })
    );
    form.append("variants", JSON.stringify(variants));
    form.append("tags", JSON.stringify(tags));
    form.append("isReturnable", String(isReturnable));
    form.append("returnWindowDays", String(parseInt(returnWindowDays, 10) || 7));
    form.append("isReplaceable", String(isReplaceable));
    form.append("isRefundable", String(isRefundable));
    form.append("existingImages", JSON.stringify(photos.filter((p) => p.kind === "existing").map((p) => (p as { url: string }).url)));
    photos.forEach((p) => {
      if (p.kind === "new") form.append("images", p.file, p.file.name);
    });

    setSubmitting(asDraft ? "draft" : "publish");
    try {
      const saved = isEdit ? await api.updateProduct(initial!._id, form) : await api.createProduct(form);
      const id = saved?._id || initial?._id;
      router.push(id ? `/seller/dashboard/products/${id}` : "/seller/dashboard/products");
    } catch (e) {
      setError(api.errorText(e, isEdit ? "Update failed." : "Product creation failed."));
      setSubmitting(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${on ? "bg-vendor-dark border-vendor-dark text-white" : "bg-white border-slate-300 text-slate-600 hover:border-vendor-dark"}`;

  return (
    <>
      <PageHeader
        backHref={isEdit ? `/seller/dashboard/products/${initial!._id}` : "/seller/dashboard/products"}
        title={isEdit ? "Edit Product" : "Add New Product"}
        subtitle={isEdit ? initial!.name : "Images upload to Cloudinary; the product goes live in your store when published."}
      />

      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <StorageFullHint error={error} />
        {notice && <SuccessBanner message={notice} />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            {/* General */}
            <Card title="General Information">
              <div className="p-5 space-y-4">
                <label className="block">
                  <span className={fieldLabel}>Product name *</span>
                  <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fresh Organic Tomatoes" />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Description *</span>
                  <textarea className={`${field} h-28 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the product, origin, usage…" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className={fieldLabel}>Category *</span>
                    {categoriesQ.loading && !categoriesQ.data ? (
                      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                    ) : (
                      <select
                        className={field}
                        value={category}
                        onChange={(e) => changeCategory(e.target.value)}
                        disabled={categoriesQ.loading && categoryNames.length === 0}
                      >
                        {categoryNames.length === 0 ? (
                          <option value="">No categories found</option>
                        ) : (
                          categoryNames.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        )}
                        {category && !categoryNames.includes(category) && (
                          <option value={category}>{category}</option>
                        )}
                      </select>
                    )}
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Sub-category</span>
                    {categoriesQ.loading && !categoriesQ.data ? (
                      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
                    ) : (
                      <select
                        className={field}
                        value={subCategory}
                        onChange={(e) => setSubCategory(e.target.value)}
                        disabled={categoriesQ.loading && subCategories.length === 0}
                      >
                        {subCategories.length === 0 ? (
                          <option value="">No sub-categories</option>
                        ) : (
                          subCategories.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))
                        )}
                        {subCategory && !subCategories.includes(subCategory) && (
                          <option value={subCategory}>{subCategory}</option>
                        )}
                      </select>
                    )}
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Supplier</span>
                    <input className={field} list="supplier-options" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
                    <datalist id="supplier-options">
                      {SUPPLIER_OPTIONS.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Expiration date</span>
                    <input type="date" className={field} value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
                  </label>
                </div>
              </div>
            </Card>

            {/* Brand */}
            <Card
              title="Brand"
              action={
                <button type="button" onClick={() => setBrandModal(true)} className="text-xs font-bold text-vendor-teal hover:underline cursor-pointer">
                  + Request new brand
                </button>
              }
            >
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600">
                  Selected: <span className="font-bold text-slate-900">{brand}</span>
                  {brand !== GENERIC_BRAND && (
                    <button
                      type="button"
                      onClick={() => {
                        setBrand(GENERIC_BRAND);
                        setBrandId(null);
                      }}
                      className="ml-2 text-vendor-teal hover:underline cursor-pointer"
                    >
                      Use store brand
                    </button>
                  )}
                </p>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className={`${field} pl-9`} value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} placeholder={`Search brands in ${category}`} aria-label="Search brands" />
                </div>
                {brandsQ.loading && !brandsQ.data ? (
                  <p className="text-xs text-slate-500">Loading brands…</p>
                ) : brandOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">No brands found. Request a new brand above, or sell under your store brand.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {brandOptions.map((b) => {
                      const on = brand === b.name;
                      return (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() => {
                            setBrand(b.name);
                            setBrandId(b.id);
                          }}
                          aria-pressed={on}
                          className={`relative flex items-center gap-2 p-2 rounded-xl border text-left cursor-pointer ${on ? "border-vendor-dark bg-vendor-soft" : "border-slate-200 hover:border-vendor-dark"}`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {b.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.logo} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-slate-300" />
                            )}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 truncate">{b.name}</span>
                          {on && <Check className="w-4 h-4 text-vendor-dark absolute top-1 right-1" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Attributes */}
            <Card
              title="Attributes"
              action={
                <button type="button" onClick={() => setAttrModal(true)} className="text-xs font-bold text-vendor-teal hover:underline cursor-pointer">
                  + Add attribute
                </button>
              }
            >
              <div className="p-5 space-y-4">
                {attrsQ.loading && !attrsQ.data ? (
                  <p className="text-xs text-slate-500">Loading attributes…</p>
                ) : !attrsQ.data?.length ? (
                  <p className="text-xs text-slate-500">No attributes for {category} yet.</p>
                ) : (
                  attrsQ.data.map((a) => (
                    <div key={a._id}>
                      <p className="text-xs font-bold text-slate-700 mb-1.5">
                        {a.name} <span className="font-normal text-slate-400">({a.type === "multiple" ? "choose any" : "choose one"})</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {a.values.map((val) => (
                          <button key={val} type="button" onClick={() => toggleAttrValue(a.name, val, a.type === "multiple")} aria-pressed={(selectedAttrs[a.name] || []).includes(val)} className={chip((selectedAttrs[a.name] || []).includes(val))}>
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Variants */}
            <Card
              title="Variations"
              action={
                <button
                  type="button"
                  onClick={() => setVariants((cur) => [...cur, { id: String(Date.now()), type: "Standard", weightUnit: "kg", weightValue: "1", color: "" }])}
                  className="text-xs font-bold text-vendor-teal hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add variant
                </button>
              }
            >
              <div className="p-5 space-y-3">
                {variants.map((v, i) => (
                  <div key={v.id} className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                    {(
                      [
                        ["type", "Type"],
                        ["weightValue", "Weight / size"],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className="block">
                        <span className={fieldLabel}>{label}</span>
                        <input className={field} value={v[k]} onChange={(e) => setVariants((cur) => cur.map((x) => (x.id === v.id ? { ...x, [k]: e.target.value } : x)))} />
                      </label>
                    ))}
                    <label className="block">
                      <span className={fieldLabel}>Unit</span>
                      <select className={field} value={v.weightUnit} onChange={(e) => setVariants((cur) => cur.map((x) => (x.id === v.id ? { ...x, weightUnit: e.target.value } : x)))}>
                        {WEIGHT_UNITS.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Color / flavour</span>
                      <input className={field} value={v.color} onChange={(e) => setVariants((cur) => cur.map((x) => (x.id === v.id ? { ...x, color: e.target.value } : x)))} />
                    </label>
                    <button
                      type="button"
                      disabled={variants.length <= 1}
                      onClick={() => setVariants((cur) => cur.filter((x) => x.id !== v.id))}
                      className="h-10 w-10 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center cursor-pointer disabled:opacity-40"
                      aria-label={`Remove variant ${i + 1}`}
                      title={variants.length <= 1 ? "At least one product variant is required." : "Remove variant"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500">The first variant sets the unit shown to customers (e.g. &ldquo;1 kg&rdquo;).</p>
              </div>
            </Card>

            {/* Photos */}
            <Card title={`Product Photos (${photos.length}/${MAX_PHOTOS})`}>
              <div className="p-5">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {photos.map((p, i) => (
                    <div key={p.kind === "new" ? p.preview : p.url} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      {p.kind === "new" && isUnpreviewableImage(p.file) ? (
                        // HEIC/HEIF: most browsers can't preview it; it is converted after upload
                        <span className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 px-1 text-center">
                          <ImagePlus className="w-5 h-5" />
                          <span className="text-[9px] font-semibold break-all line-clamp-2">{p.file.name}</span>
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.kind === "new" ? p.preview : p.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      )}
                      {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-vendor-dark text-white text-[9px] font-bold">COVER</span>}
                      <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-slate-700 hover:text-red-600 flex items-center justify-center cursor-pointer" aria-label={`Remove photo ${i + 1}`}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-vendor-dark text-slate-500 hover:text-vendor-dark flex flex-col items-center justify-center gap-1 cursor-pointer">
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[11px] font-bold">Add photos</span>
                      <input type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" onChange={addPhotos} />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {ALLOWED_IMAGE_LABEL} · max {MAX_IMAGE_LABEL} each · up to {MAX_PHOTOS} photos
                </p>
                {photoErrors.length > 0 && (
                  <ul className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 space-y-0.5 text-xs text-red-700" role="alert">
                    {photoErrors.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Pricing */}
            <Card title="Pricing (NPR)">
              <div className="p-5 space-y-4">
                <label className="block">
                  <span className={fieldLabel}>Base price *</span>
                  <input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Discount type</span>
                  <select className={field} value={discountCategory} onChange={(e) => setDiscountCategory(e.target.value)}>
                    {DISCOUNT_CATEGORIES.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                {discountCategory !== "No Discount" && (
                  <label className="block">
                    <span className={fieldLabel}>Discount value {discountCategory === "Percentage Discount" ? "(%)" : "(NPR)"}</span>
                    <input className={field} inputMode="decimal" value={discountValue} onChange={(e) => setDiscountValue(e.target.value.replace(/[^\d.]/g, ""))} />
                  </label>
                )}
              </div>
            </Card>

            {/* Inventory */}
            <Card title="Inventory">
              <div className="p-5 space-y-4">
                <label className="block">
                  <span className={fieldLabel}>SKU</span>
                  <div className="flex gap-2">
                    <input className={field} value={sku} onChange={(e) => setSku(e.target.value)} />
                    <button type="button" onClick={() => setSku(generateSku(category))} className={btn.outline} aria-label="Generate SKU" title="Generate SKU">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={fieldLabel}>Stock quantity *</span>
                    <input className={field} inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Reorder level</span>
                    <input className={field} inputMode="numeric" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value.replace(/\D/g, ""))} />
                  </label>
                </div>
              </div>
            </Card>

            {/* Status & visibility */}
            <Card title="Status & Visibility">
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["active", "Active"],
                      ["not_active", "Not Active"],
                      ["schedule", "Schedule"],
                    ] as const
                  ).map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setStatus(k)} aria-pressed={status === k} className={chip(status === k)}>
                      {l}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {(
                    [
                      ["featured", "Featured product"],
                      ["bestSellers", "Show in Best Sellers"],
                      ["newArrivals", "Show in New Arrivals"],
                    ] as const
                  ).map(([k, l]) => (
                    <Toggle key={k} label={l} on={visibility[k]} onChange={(v) => setVisibility((cur) => ({ ...cur, [k]: v }))} />
                  ))}
                </div>
              </div>
            </Card>

            {/* Return policy */}
            <Card title="Return, Replace & Refund">
              <div className="p-5 space-y-2">
                <Toggle label="Returnable" on={isReturnable} onChange={setIsReturnable} />
                {isReturnable && (
                  <label className="flex items-center gap-2 pl-12 text-xs text-slate-600">
                    Window
                    <input className={`${field} w-20 h-8`} inputMode="numeric" value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value.replace(/\D/g, ""))} />
                    days
                  </label>
                )}
                <Toggle label="Replaceable" on={isReplaceable} onChange={setIsReplaceable} />
                <Toggle label="Refundable" on={isRefundable} onChange={setIsRefundable} />
              </div>
            </Card>

            {/* Tags */}
            <Card title="Product Tags">
              <div className="p-5 space-y-3">
                <div className="flex gap-2">
                  <input className={field} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag" />
                  <button type="button" onClick={addTag} className={btn.outline}>
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {t}
                      <button type="button" onClick={() => setTags((cur) => cur.filter((x) => x !== t))} className="p-0.5 rounded-full hover:bg-slate-200 cursor-pointer" aria-label={`Remove tag ${t}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Submit bar */}
        <div className="sticky bottom-0 z-20 -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 bg-white/95 backdrop-blur border-t border-slate-200 px-3 sm:px-4 md:px-6 lg:px-8 py-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => router.back()} className={btn.ghost} disabled={submitting !== null}>
            Cancel
          </button>
          {!isEdit && (
            <button type="button" onClick={() => submit(true)} className={btn.outline} disabled={submitting !== null}>
              {submitting === "draft" ? "Saving…" : "Save as Draft"}
            </button>
          )}
          <button type="button" onClick={() => submit(false)} className={btn.primary} disabled={submitting !== null}>
            {submitting === "publish" ? (isEdit ? "Updating…" : "Publishing…") : isEdit ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      <BrandRequestModal
        open={brandModal}
        onClose={() => setBrandModal(false)}
        defaultCategory={category}
        defaultName={brandSearch}
        availableCategories={categoryNames}
        onSubmitted={(m) => {
          setNotice(`${m} You can use it once it's approved.`);
          brandsQ.reload();
        }}
      />
      <AttributeModal
        open={attrModal}
        onClose={() => setAttrModal(false)}
        defaultCategory={category}
        availableCategories={categoryNames}
        onSubmitted={(m) => {
          setNotice(m);
          attrsQ.reload();
        }}
      />
    </>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
      <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-vendor-done" : "bg-slate-300"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-4.5" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}
