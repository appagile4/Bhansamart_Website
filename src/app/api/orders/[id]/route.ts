import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backendProxy";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/orders/:id → full order document (vendor or customer of that order)
export async function GET(req: NextRequest, context: Ctx) {
  const { id } = await context.params;
  return proxyToBackend(req, `/orders/${encodeURIComponent(id)}`);
}
