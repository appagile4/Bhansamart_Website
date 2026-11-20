/**
 * Shared Seller Hub class names, taken from the app's vendor auth styles
 * (Bhansamart_frontend/src/app/(auth)/vendorAuth/login/vendorlogin.tsx).
 */

/** Field label — 12.5px bold slate-900 */
export const sellerLabel = "block text-[13px] font-bold text-slate-900 mb-1.5";

/** Input box — white, slate-300 border, 8px radius, 44px tall; icon padding when used with an icon */
export const sellerInput =
  "w-full h-11 bg-white text-sm text-slate-900 px-3 rounded-lg border border-slate-300 focus:border-vendor-dark focus:ring-2 focus:ring-vendor-100 focus:outline-none transition-colors placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500";
export const sellerInputWithIcon = `${sellerInput} pl-10`;
export const sellerInputIcon =
  "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none";

/** Helper text under a field */
export const sellerHelper = "mt-1.5 text-xs text-slate-500 leading-4";

/** Primary button — solid dark teal, 46px tall */
export const sellerPrimaryBtn =
  "w-full h-[46px] px-4 rounded-lg bg-vendor-dark hover:bg-vendor-mid active:bg-vendor-dark text-white font-bold text-sm tracking-wide shadow-md shadow-vendor-dark/20 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed";

/** Outline button — white with dark teal border (app's "Start Seller Onboarding") */
export const sellerOutlineBtn =
  "w-full h-10 px-4 rounded-lg bg-white border-[1.5px] border-vendor-dark text-vendor-dark font-bold text-[13px] hover:bg-vendor-soft transition-colors flex items-center justify-center gap-2 cursor-pointer";

/** Inline teal link (app's "Forgot password?") */
export const sellerLink = "text-xs font-semibold text-vendor-teal hover:underline cursor-pointer";

/** Error / success banners */
export const sellerErrorBox =
  "p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700";
export const sellerSuccessBox =
  "p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800";
