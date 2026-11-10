import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getBackendApiUrl } from "@/lib/apiConfig";

export async function POST(req: NextRequest) {
  const backendUrl = getBackendApiUrl();

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // 1. Verify user with backend session
    const meRes = await fetch(`${backendUrl}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    });

    const meData = await meRes.json();
    if (!meRes.ok || !meData?.data?.user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please log in again." },
        { status: 401 }
      );
    }

    const currentUser = meData.data.user;
    const body = await req.json();
    const newEmail = (body.newEmail || "").trim().toLowerCase();

    // 2. Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // 3. Ensure new email is different from current email
    if (newEmail === (currentUser.email || "").toLowerCase().trim()) {
      return NextResponse.json(
        { success: false, message: "The new email cannot be the same as your current email address." },
        { status: 400 }
      );
    }

    // 4. Ensure new email is not already registered by another account
    const db = await getDb();
    let queryId: ObjectId | null = null;
    try {
      queryId = new ObjectId(currentUser._id);
    } catch {
      queryId = null;
    }

    const existingUser = await db.collection("users").findOne({
      email: newEmail,
      ...(queryId ? { _id: { $ne: queryId } } : {}),
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "This email address is already registered to another account." },
        { status: 400 }
      );
    }

    // 5. Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 6. Store OTP in MongoDB email_verification_otps collection
    await db.collection("email_verification_otps").updateOne(
      { userId: currentUser._id.toString() },
      {
        $set: {
          userId: currentUser._id.toString(),
          currentEmail: currentUser.email,
          newEmail,
          otp,
          expiresAt,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`[BhansaMart] Email Change OTP for ${newEmail}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${newEmail}.`,
      otpPreview: otp,
    });
  } catch (err: unknown) {
    console.error("[Send Email OTP Error]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
