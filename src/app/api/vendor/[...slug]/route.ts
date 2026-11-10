import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

async function proxyVendorApi(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    const path = slug.join("/");
    const backendUrl = getBackendApiUrl();
    const query = new URL(req.url).search;
    const url = `${backendUrl}/vendor/${path}${query}`;

    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const contentType = req.headers.get("content-type") || "";
    let body: any = undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (contentType.includes("application/json")) {
        headers["Content-Type"] = "application/json";
        const jsonBody = await req.json().catch(() => null);
        if (jsonBody !== null) {
          body = JSON.stringify(jsonBody);
        }
      } else if (contentType.includes("multipart/form-data")) {
        // Do not set Content-Type header so fetch can set boundary automatically
        body = await req.formData();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        body = await req.text();
      } else if (contentType) {
        headers["Content-Type"] = contentType;
        body = await req.text();
      }
    }

    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const resContentType = res.headers.get("content-type") || "";

    if (resContentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": resContentType },
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_")) {
      throw error;
    }
    console.error("[Vendor API Proxy Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to connect to the vendor backend service.",
      },
      { status: 502 }
    );
  }
}

export const GET = proxyVendorApi;
export const POST = proxyVendorApi;
export const PUT = proxyVendorApi;
export const PATCH = proxyVendorApi;
export const DELETE = proxyVendorApi;
