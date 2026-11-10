import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/apiConfig";

/**
 * Normalizes paymentMethod string to strictly match Mongoose enum in backend Order.js:
 * [
 *   "Cash on delivery",
 *   "esewa",
 *   "khalti",
 *   "card",
 *   "Vendor QR Code (Direct)",
 *   "Online Payment",
 *   "Replacement (No Charge)"
 * ]
 */
function normalizePaymentMethod(method?: string, methodKey?: string): string {
  const m = (method || "").toLowerCase().trim();
  const k = (methodKey || "").toLowerCase().trim();

  // Cash on delivery / COD
  if (k === "cod" || m.includes("cash") || m.includes("delivery") || m.includes("cod")) {
    return "Cash on delivery";
  }
  // eSewa
  if (k === "esewa" || m.includes("esewa")) {
    return "esewa";
  }
  // Khalti
  if (k === "khalti" || m.includes("khalti")) {
    return "khalti";
  }
  // Card
  if (k === "card" || m.includes("card") || m.includes("credit") || m.includes("debit")) {
    return "card";
  }
  // Vendor QR / UPI / Fonepay
  if (k === "upi" || m.includes("upi") || m.includes("qr") || m.includes("fonepay") || m.includes("vendor")) {
    return "Vendor QR Code (Direct)";
  }
  // Direct Bank Transfer / Wallet / Online Payment
  if (k === "bank_transfer" || k === "wallet" || m.includes("bank") || m.includes("transfer") || m.includes("wallet") || m.includes("online")) {
    return "Online Payment";
  }

  const VALID_ENUMS = [
    "Cash on delivery",
    "esewa",
    "khalti",
    "card",
    "Vendor QR Code (Direct)",
    "Online Payment",
    "Replacement (No Charge)",
  ];

  const matched = VALID_ENUMS.find((v) => v.toLowerCase() === m);
  if (matched) return matched;

  return "Cash on delivery";
}

/**
 * POST /api/orders
 * Place a new order with live backend validation
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Please log in to place your order." },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const body = await req.json();

    // Sanitize paymentMethod so it strictly adheres to backend enum
    body.paymentMethod = normalizePaymentMethod(body.paymentMethod, body.paymentMethodKey);

    const res = await fetch(`${backendUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Create Order Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to place order on server." },
      { status: 503 }
    );
  }
}

/**
 * GET /api/orders
 * Retrieve list of orders
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authorization required" },
      { status: 401 }
    );
  }

  try {
    const backendUrl = getBackendApiUrl();
    const res = await fetch(`${backendUrl}/orders/my-orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Get Orders Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders." },
      { status: 503 }
    );
  }
}
