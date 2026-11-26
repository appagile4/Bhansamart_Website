"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { CROP_RULES, canBeSquare, largestRect, loadImage, minCropSide, renderCrop, startsFree, toPercent, toPixels, type CropKind } from "@/lib/imageCrop";

type Job = { file: File; kind: CropKind; url: string; width: number; height: number; done: (result: File | null) => void };

/**
 * Crop step before an upload: a box the user drags and resizes over the image.
 *
 *   const { cropImage, cropDialog } = useImageCrop();
 *   const cropped = await cropImage(file, "qr"); // null = the user cancelled
 *
 * Render {cropDialog} next to (not inside) any other modal. Files that can't be cropped in the browser
 * (HEIC in most browsers, SVG, GIF) are returned unchanged.
 */
export function useImageCrop() {
  const [job, setJob] = useState<Job | null>(null);

  const cropImage = useCallback(async (file: File, kind: CropKind): Promise<File | null> => {
    if (/svg|gif/i.test(file.type)) return file;
    const url = URL.createObjectURL(file);
    try {
      const { naturalWidth: width, naturalHeight: height } = await loadImage(url);
      if (!width || !height) throw new Error("no size");
      return await new Promise<File | null>((resolve) => setJob({ file, kind, url, width, height, done: resolve }));
    } catch {
      return file;
    } finally {
      setJob(null);
      URL.revokeObjectURL(url);
    }
  }, []);

  return { cropImage, cropDialog: job ? <CropDialog key={job.url} job={job} /> : null };
}

const handleStyle = {
  "--rc-drag-handle-size": "16px",
  "--rc-drag-handle-mobile-size": "26px",
  "--rc-drag-handle-bg-colour": "rgba(15, 23, 42, 0.85)",
  "--rc-border-color": "#fff",
} as React.CSSProperties;

function CropDialog({ job }: { job: Job }) {
  const { file, kind, url, width, height, done } = job;
  const rules = CROP_RULES[kind];
  const minSide = minCropSide(kind);
  const squarePossible = canBeSquare(width, height, kind);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [free, setFree] = useState(() => startsFree(width, height, kind));
  const [crop, setCrop] = useState<PercentCrop>(() => toPercent(largestRect(width, height, startsFree(width, height, kind)), width, height));
  const [shownWidth, setShownWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Escape closes only this dialog, not a modal behind it (those listen on document)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && e.stopPropagation();
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  // The library's minimum is in screen pixels, so track how large the image is shown
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const observer = new ResizeObserver(() => setShownWidth(img.clientWidth));
    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  const rect = toPixels(crop, width, height, kind, free);
  const side = Math.max(rect.width, rect.height);
  const tooSmall = side < minSide;
  const minShown = free ? 24 : Math.floor((Math.min(minSide, width, height) / width) * shownWidth);

  const changeShape = (nextFree: boolean) => {
    setFree(nextFree);
    setCrop(toPercent(largestRect(width, height, nextFree), width, height));
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      done(await renderCrop(file, url, rect, kind));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image could not be cropped.");
      setBusy(false);
    }
  };

  const shapeBtn = (on: boolean) =>
    `h-8 px-3 rounded-md text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${on ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`;

  return (
    <dialog
      ref={dialogRef}
      aria-label={rules.title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) done(null);
      }}
      className="m-auto w-[min(94vw,34rem)] max-h-[96dvh] overflow-x-hidden overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-2xl backdrop:bg-slate-900/60"
    >
      <h2 className="text-base font-extrabold text-slate-900">{rules.title}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Drag the corners to resize the box. Drag inside it to move.
        {kind === "qr" && " Keep only the QR code so it is easy to scan."}
      </p>

      {rules.allowFree && (
        <div className="mt-3 inline-flex gap-1 p-1 rounded-lg bg-slate-100" role="group" aria-label="Crop shape">
          <button type="button" disabled={busy || !squarePossible} aria-pressed={!free} onClick={() => changeShape(false)} className={shapeBtn(!free)}>
            Square
          </button>
          <button type="button" disabled={busy} aria-pressed={free} onClick={() => changeShape(true)} className={shapeBtn(free)}>
            Whole / free shape
          </button>
        </div>
      )}

      <div className="mt-3 flex justify-center rounded-xl bg-slate-100 p-3.5" style={handleStyle}>
        <ReactCrop
          crop={crop}
          onChange={(_, percent) => setCrop(percent)}
          aspect={free ? undefined : 1}
          minWidth={minShown}
          minHeight={minShown}
          keepSelection
          disabled={busy}
          style={{ maxHeight: "54dvh" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={url} alt="Image to crop" draggable={false} style={{ maxHeight: "54dvh" }} />
        </ReactCrop>
      </div>

      <p className={`mt-2 text-[11px] ${tooSmall ? "font-bold text-red-600" : "text-slate-500"}`} role={tooSmall ? "alert" : undefined}>
        Selected: {rect.width}×{rect.height} px
        {tooSmall ? ` — too small, the longer side must be at least ${minSide} px.` : rect.width !== rect.height ? " — blank space is added to make it square." : ""}
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" disabled={busy} onClick={() => done(null)} className="h-10 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-60">
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || tooSmall}
          onClick={confirm}
          className="h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm font-bold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Cropping…" : "Use image"}
        </button>
      </div>
    </dialog>
  );
}
