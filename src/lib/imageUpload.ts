/**
 * Image upload rules for the SELLER (vendor) side of the website only: product photos,
 * store logo (onboarding), payment QR and brand request logo. Admin uploads are not restricted here.
 *
 * Size limit matches the backend (middleware/uploadMiddleware.js: 5 MB). Types: JPEG, PNG, WebP,
 * plus HEIC/HEIF so iPhone photos work — Cloudinary converts them on delivery
 * (fetch_format: "auto"), though most non-Safari browsers can't preview them before upload.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_LABEL = "5 MB";

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/pjpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

export const ALLOWED_IMAGE_LABEL = "JPG, PNG, WebP or HEIC";

/** For `<input type="file" accept={IMAGE_ACCEPT}>`: the picker only offers these types */
export const IMAGE_ACCEPT = [...ALLOWED_MIME.filter((m) => m !== "image/pjpeg"), ...ALLOWED_EXT.map((e) => `.${e}`)].join(",");

const extOf = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

export const formatFileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/**
 * Returns an error message for a file that may not be uploaded, or null when it is fine.
 * Checks the MIME type and the file extension (some browsers report an empty type, e.g. for HEIC).
 */
export function validateImageFile(file: File): string | null {
  const ext = extOf(file.name);
  const mime = (file.type || "").toLowerCase();
  const typeOk = mime ? ALLOWED_MIME.includes(mime) : ALLOWED_EXT.includes(ext);
  if (!typeOk) return `"${file.name}" isn't a supported image. Only ${ALLOWED_IMAGE_LABEL} files are allowed.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_IMAGE_BYTES) {
    // Round up so a file just over the limit never reads as "5.0 MB"
    const mb = Math.ceil((file.size / (1024 * 1024)) * 10) / 10;
    return `"${file.name}" is ${mb.toFixed(1)} MB. Images must be ${MAX_IMAGE_LABEL} or smaller.`;
  }
  return null;
}

/**
 * Minimum image size (pixels) per upload type. The backend enforces the same rule
 * (middleware/imageSizeMiddleware.js); checking here tells the user before uploading.
 */
export const MIN_IMAGE_SIZE = {
  product: { shorter: 600, longer: 1000, label: "Product photo" },
  category: { shorter: 400, longer: 600, label: "Category image" },
  qr: { shorter: 400, longer: 400, label: "Payment QR image" },
  logo: { shorter: 300, longer: 300, label: "Logo" },
} as const;

export type ImageKind = keyof typeof MIN_IMAGE_SIZE;

export const minSizeLabel = (kind: ImageKind) => `min ${MIN_IMAGE_SIZE[kind].longer}×${MIN_IMAGE_SIZE[kind].shorter} px`;

/** Error message when the image is too small, otherwise null (also null if the browser can't read it, e.g. HEIC). */
export async function imageSizeError(file: File, kind: ImageKind): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
    const min = MIN_IMAGE_SIZE[kind];
    // SVGs scale freely, so their nominal size doesn't matter (same as the backend)
    if (!width || !height || file.type === "image/svg+xml") return null;
    if (Math.min(width, height) >= min.shorter && Math.max(width, height) >= min.longer) return null;
    return `"${file.name}": ${min.label} is too small (${width}×${height} px). Please upload at least ${min.longer}×${min.shorter} px.`;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Splits a multi-file pick into accepted files and error messages for the rejected ones. */
export function partitionImageFiles(files: File[]): { accepted: File[]; errors: string[] } {
  const accepted: File[] = [];
  const errors: string[] = [];
  for (const f of files) {
    const err = validateImageFile(f);
    if (err) errors.push(err);
    else accepted.push(f);
  }
  return { accepted, errors };
}

/** True for formats most browsers can't render in an <img> before upload */
export const isUnpreviewableImage = (file: File) => /hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
