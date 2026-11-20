"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorText } from "./api";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Load data for a page. Re-runs when `key` changes; `reload()` refetches;
 * `setData` lets pages apply optimistic updates.
 */
export function useAsync<T>(fetcher: () => Promise<T>, key: string = "") {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let alive = true;
    fetcherRef
      .current()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => alive && setState((s) => ({ ...s, error: errorText(err), loading: false })));
    return () => {
      alive = false;
    };
  }, [key, nonce]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setNonce((n) => n + 1);
  }, []);

  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload, setData };
}
