"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as api from "@/lib/seller/api";
import { useAsync } from "@/lib/seller/useAsync";
import ProductEditor from "@/components/vendor/ProductEditor";
import { ErrorBanner, LoadingBlock } from "@/components/vendor/ui";

export default function AddProductPage() {
  return (
    <Suspense fallback={<LoadingBlock text="Loading product form…" />}>
      <AddOrEdit />
    </Suspense>
  );
}

function AddOrEdit() {
  const editId = useSearchParams().get("edit") || "";
  return editId ? <EditExisting id={editId} /> : <ProductEditor key="new" initial={null} />;
}

function EditExisting({ id }: { id: string }) {
  const { data, error, loading, reload } = useAsync(() => api.getProduct(id), id);
  if (loading && !data) return <LoadingBlock text="Loading product…" />;
  if (!data) return <ErrorBanner message={error || "Product not found."} onRetry={reload} />;
  return <ProductEditor key={data._id} initial={data} />;
}
