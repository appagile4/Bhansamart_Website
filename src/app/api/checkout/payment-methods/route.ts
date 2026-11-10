import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bhansamart.webstudiomatrix.com/api";

const DEFAULT_PAYMENT_METHODS = [
  {
    methodKey: "cod",
    displayName: "Cash on delivery",
    isEnabled: true,
    instructions: "Pay with cash at your doorstep upon delivery",
    maxAmount: 10000,
  },
  {
    methodKey: "esewa",
    displayName: "eSewa Mobile Wallet",
    isEnabled: true,
    instructions: "Instant digital payment via eSewa",
  },
  {
    methodKey: "khalti",
    displayName: "Khalti Digital Wallet",
    isEnabled: true,
    instructions: "Fast checkout using Khalti wallet",
  },
  {
    methodKey: "upi",
    displayName: "UPI / QR Code Payment",
    isEnabled: true,
    instructions: "Pay via Google Pay, PhonePe, Paytm, or BHIM",
  },
  {
    methodKey: "bank_transfer",
    displayName: "Direct Bank Transfer",
    isEnabled: true,
    instructions: "Direct NEFT / IPS bank transfer to treasury",
  },
];

/**
 * GET /api/checkout/payment-methods
 * Returns active checkout payment methods
 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/checkout/payment-methods`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.paymentMethods?.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.warn("Could not fetch payment methods from backend, using defaults:", error);
  }

  // Fallback to defaults
  return NextResponse.json({
    success: true,
    data: {
      paymentMethods: DEFAULT_PAYMENT_METHODS,
    },
  });
}
