import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

type Ctx = { params: Promise<{ id: string; reviewId: string }> };

// DELETE /api/products/:id/reviews/:reviewId → backend review removal (vendor moderation)
export async function DELETE(req: NextRequest, context: Ctx) {
  const { id, reviewId } = await context.params;
  return proxyToBackend(req, `/products/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}`);
}
