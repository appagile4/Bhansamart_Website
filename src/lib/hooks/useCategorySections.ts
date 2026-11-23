"use client";

import { useEffect, useState } from "react";
import { SectionCategoryData } from "@/lib/constants/categories";

// Shared across components so the list is fetched once per page load
let cached: SectionCategoryData[] | null = null;
let inflight: Promise<{ sections: SectionCategoryData[]; error: string | null }> | null = null;
let lastError: string | null = null;

function loadSections(): Promise<{ sections: SectionCategoryData[]; error: string | null }> {
  if (cached && cached.length > 0) return Promise.resolve({ sections: cached, error: null });
  if (!inflight) {
    inflight = fetch("/api/categories")
      .then(async (res) => {
        const json = await res.json();
        if (json?.success && Array.isArray(json.sections) && json.sections.length > 0) {
          cached = json.sections;
          lastError = null;
          return { sections: json.sections, error: null };
        }
        cached = null;
        lastError = json?.message || `Failed to load categories (HTTP ${res.status})`;
        return { sections: [], error: lastError };
      })
      .catch((err) => {
        cached = null;
        lastError = err instanceof Error ? err.message : "Failed to connect to category service";
        return { sections: [], error: lastError };
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Main categories (with subcategories) fetched dynamically from the database.
 * No hardcoded fallback categories: if API fails, returns empty sections and an error message.
 */
export function useCategorySections(): {
  sections: SectionCategoryData[];
  loaded: boolean;
  error: string | null;
} {
  const [state, setState] = useState(() => ({
    sections: cached ?? [],
    loaded: cached !== null || lastError !== null,
    error: lastError,
  }));

  useEffect(() => {
    if (cached && cached.length > 0) return;
    let active = true;
    loadSections().then((res) => {
      if (active) setState({ sections: res.sections, loaded: true, error: res.error });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
