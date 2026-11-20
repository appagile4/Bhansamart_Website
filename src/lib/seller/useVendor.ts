"use client";

import { useSyncExternalStore } from "react";
import { useAppSelector } from "@/redux/hooks";
import { vendorInitialState, type VendorState } from "@/redux/slices/vendorSlice";

const noopSubscribe = () => () => {};

/**
 * false on the server AND during hydration, true afterwards.
 * The seller session lives in localStorage, so the server always renders the signed-out state;
 * the client must render the same markup until hydration finishes, then switch to real data.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/** Seller Hub state, hydration-safe: the initial (empty) state until hydrated, then the live store. */
export function useVendor(): VendorState {
  const live = useAppSelector((s) => s.vendor);
  return useHydrated() ? live : vendorInitialState;
}
