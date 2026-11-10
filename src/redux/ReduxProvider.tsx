"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { initializeAuth } from "./slices/authSlice";
import { initializeCart, fetchBackendCart } from "./slices/cartSlice";
import { initializeAddress } from "./slices/addressSlice";
import { initializeVendor } from "./slices/vendorSlice";

function ReduxInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(initializeAddress());
    store.dispatch(initializeCart());
    store.dispatch(initializeVendor());
    const token =
      typeof window !== "undefined" ? localStorage.getItem("bhansa_token") : null;
    if (token) {
      store.dispatch(fetchBackendCart());
    }
  }, []);

  return <>{children}</>;
}

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ReduxInitializer>{children}</ReduxInitializer>
    </Provider>
  );
}
