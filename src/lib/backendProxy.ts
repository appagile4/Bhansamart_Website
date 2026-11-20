import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/**
 * Forwards the incoming request (method, auth header, query string and body —
 * JSON, multipart or text) to `${BACKEND_API_URL}${backendPath}` and relays the response.
 */
export async function proxyToBackend(req: NextRequest, backendPath: string): Promise<NextResponse> {
  try {
    const query = new URL(req.url).search;
    const url = `${getBackendApiUrl()}${backendPath}${query}`;

    const headers: Record<string, string> = { Accept: "application/json, text/plain, */*" };
    const auth = req.headers.get("authorization");
    if (auth) headers["Authorization"] = auth;

    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        headers["Content-Type"] = "application/json";
        const json = await req.json().catch(() => null);
        if (json !== null) body = JSON.stringify(json);
      } else if (contentType.includes("multipart/form-data")) {
        // let fetch set the multipart boundary
        body = await req.formData();
      } else if (contentType) {
        headers["Content-Type"] = contentType;
        body = await req.text();
      }
    }

    const res = await fetch(url, { method: req.method, headers, body, cache: "no-store" });
    const resType = res.headers.get("content-type") || "";
    if (resType.includes("application/json")) {
      return NextResponse.json(await res.json(), { status: res.status });
    }
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": resType || "text/plain" },
    });
  } catch (error) {
    console.error(`[Backend Proxy Error] ${backendPath}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to reach the BhansaMart server.",
      },
      { status: 502 }
    );
  }
}

type SlugContext = { params: Promise<{ slug?: string[] }> };

/** Route handlers for an optional catch-all segment mounted under `basePath`. */
export function catchAllProxy(basePath: string) {
  const handler = async (req: NextRequest, context: SlugContext) => {
    const { slug } = await context.params;
    const rest = slug?.length ? `/${slug.map(encodeURIComponent).join("/")}` : "";
    return proxyToBackend(req, `${basePath}${rest}`);
  };
  return { GET: handler, POST: handler, PUT: handler, PATCH: handler, DELETE: handler };
}
