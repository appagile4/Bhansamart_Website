import { MAX_IMAGE_BYTES, MIN_IMAGE_SIZE, type ImageKind } from "./imageUpload";

/** Uploads that get a crop step. Product photos are deliberately not cropped. */
export type CropKind = Exclude<ImageKind, "product">;

/**
 * maxOutput: the backend scales down to this anyway (utils/imageCompressor.js presets).
 * allowFree: the box may be any shape; the result is padded to a square (wide logos, landscape category images).
 */
export const CROP_RULES: Record<CropKind, { title: string; maxOutput: number; allowFree: boolean; startFree: boolean }> = {
  qr: { title: "Crop payment QR", maxOutput: 1400, allowFree: false, startFree: false },
  logo: { title: "Crop logo", maxOutput: 1000, allowFree: true, startFree: true },
  category: { title: "Crop category image", maxOutput: 1200, allowFree: true, startFree: false },
};

/** Crop box in image pixels. */
export type CropRect = { x: number; y: number; width: number; height: number };

/** The saved image is a square as long as the box's longer side; it must be at least this many pixels. */
export const minCropSide = (kind: CropKind) => MIN_IMAGE_SIZE[kind].longer;

/** A square box is only possible when the image's shorter side meets the minimum. */
export const canBeSquare = (width: number, height: number, kind: CropKind) => Math.min(width, height) >= minCropSide(kind);

export const startsFree = (width: number, height: number, kind: CropKind) =>
  CROP_RULES[kind].allowFree && (CROP_RULES[kind].startFree || !canBeSquare(width, height, kind));

/** Largest box: the whole image, or the biggest centred square. */
export function largestRect(width: number, height: number, free: boolean): CropRect {
  if (free) return { x: 0, y: 0, width, height };
  const side = Math.min(width, height);
  return { x: Math.round((width - side) / 2), y: Math.round((height - side) / 2), width: side, height: side };
}

export const toPercent = (r: CropRect, width: number, height: number) => ({
  unit: "%" as const,
  x: (r.x / width) * 100,
  y: (r.y / height) * 100,
  width: (r.width / width) * 100,
  height: (r.height / height) * 100,
});

const between = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Converts the on-screen box to whole image pixels, always inside the image and exactly square unless free. */
export function toPixels(p: CropRect, width: number, height: number, kind: CropKind, free: boolean): CropRect {
  let w = between(Math.round((p.width / 100) * width), 1, width);
  let h = between(Math.round((p.height / 100) * height), 1, height);
  if (!free) {
    const max = Math.min(width, height);
    w = h = between(w, Math.min(minCropSide(kind), max), max);
  }
  return {
    width: w,
    height: h,
    x: between(Math.round((p.x / 100) * width), 0, width - w),
    y: between(Math.round((p.y / 100) * height), 0, height - h),
  };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This image could not be read."));
    img.src = url;
  });
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("The image could not be cropped. Please try another one."))), type, quality)
  );

/** Cuts the box out of the image, exactly as shown (never rotated). Saved lossless unless that exceeds the upload limit. */
export async function renderCrop(file: File, url: string, rect: CropRect, kind: CropKind): Promise<File> {
  const img = await loadImage(url);
  // Nothing was cut or padded: keep the user's own file
  if (rect.width === rect.height && rect.width === img.naturalWidth && rect.height === img.naturalHeight) return file;

  const side = Math.max(rect.width, rect.height);
  const out = Math.min(side, CROP_RULES[kind].maxOutput);
  const scale = out / side;
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not crop this image.");

  const paint = (whiteBackground: boolean) => {
    ctx.clearRect(0, 0, out, out);
    if (whiteBackground) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, out, out);
    }
    ctx.imageSmoothingQuality = "high";
    const w = Math.round(rect.width * scale);
    const h = Math.round(rect.height * scale);
    ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, Math.round((out - w) / 2), Math.round((out - h) / 2), w, h);
  };

  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  // PNG and WebP can be transparent, so any padding stays transparent too
  paint(!/png|webp/i.test(file.type));
  const png = await toBlob(canvas, "image/png");
  if (png.size <= MAX_IMAGE_BYTES) return new File([png], `${name}.png`, { type: "image/png" });

  paint(true);
  return new File([await toBlob(canvas, "image/jpeg", 0.95)], `${name}.jpg`, { type: "image/jpeg" });
}
