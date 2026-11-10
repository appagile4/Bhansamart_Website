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
    const search = req.nextUrl.searchParams.toString();
    const query = search ? `?${search}` : "";
    const url = `${backendUrl}/vendor/${path}${query}`;

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        headers[key] = value;
      }
    });

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        options.body = JSON.stringify(await req.json());
      } else if (contentType.includes("multipart/form-data")) {
        options.body = await req.formData();
      } else {
        options.body = await req.text();
      }
    }

    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error: any) {
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
