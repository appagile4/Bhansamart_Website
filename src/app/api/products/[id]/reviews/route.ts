import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/products/:id/reviews → backend product reviews
export async function GET(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  return proxyToBackend(req, `/products/${encodeURIComponent(id)}/reviews`);
}
