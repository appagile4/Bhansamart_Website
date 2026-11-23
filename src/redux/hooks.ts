import { useSyncExternalStore } from "react";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import { PRESET_HUBS } from "@/lib/addressHubs";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const emptySubscribe = () => () => {};

/** false on the server and during hydration, true once the client has hydrated. */
export const useHydrated = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

/**
 * The selected delivery address, hydration-safe.
 * The saved address lives in localStorage (unknown to the server), so until hydration
 * finishes this returns the same default hub the server rendered, then the real one.
 */
export const useCurrentAddress = () => {
  const currentAddress = useAppSelector((state) => state.address.currentAddress);
  return useHydrated() ? currentAddress : PRESET_HUBS[0];
};
