"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { initializeAuth } from "./slices/authSlice";
import { initializeCart, fetchBackendCart } from "./slices/cartSlice";

function ReduxInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(initializeCart());
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
