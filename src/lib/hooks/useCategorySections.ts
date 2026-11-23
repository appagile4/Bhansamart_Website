"use client";

import { useEffect, useState } from "react";
import { SectionCategoryData } from "@/lib/constants/categories";

// Shared across components so the list is fetched once per page load
let cached: SectionCategoryData[] | null = null;
let inflight: Promise<SectionCategoryData[]> | null = null;

function loadSections(): Promise<SectionCategoryData[]> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        const sections: SectionCategoryData[] =
          json?.success && Array.isArray(json.sections) && json.sections.length
            ? json.sections
            : [];
        cached = sections;
        return sections;
      })
      // Network error: don't cache empty so the next call can retry
      .catch(() => [])
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Main categories (with subcategories) fetched dynamically from the database.
 * `sections` starts empty and `loaded` is false until the real DB categories arrive.
 * Components display skeleton loading during this state instead of flashing static categories.
 */
export function useCategorySections(): {
  sections: SectionCategoryData[];
  loaded: boolean;
} {
  const [state, setState] = useState(() => ({
    sections: cached ?? [],
    loaded: cached !== null,
  }));

  useEffect(() => {
    if (cached) return;
    let active = true;
    loadSections().then((s) => {
      if (active) setState({ sections: s, loaded: true });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
