import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const backendUrl =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://bhansamart.webstudiomatrix.com/api";

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
    const otp = (body.otp || "").trim();

    if (!newEmail) {
      return NextResponse.json(
        { success: false, message: "New email address is required." },
        { status: 400 }
      );
    }

    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 2. Find pending verification OTP in database
    const otpDoc = await db.collection("email_verification_otps").findOne({
      userId: currentUser._id.toString(),
      newEmail,
    });

    if (!otpDoc) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active verification request found for this email. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (new Date() > new Date(otpDoc.expiresAt)) {
      await db.collection("email_verification_otps").deleteOne({ _id: otpDoc._id });
      return NextResponse.json(
        {
          success: false,
          message: "Verification code has expired. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // 4. Verify code
    if (otpDoc.otp !== otp) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect verification code. Please check your email and try again.",
        },
        { status: 400 }
      );
    }

    // 5. Update user email in MongoDB Atlas database
    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(currentUser._id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid user account identifier." },
        { status: 400 }
      );
    }

    await db.collection("users").updateOne(
      { _id: userObjectId },
      {
        $set: {
          email: newEmail,
          isEmailVerified: true,
          updatedAt: new Date(),
        },
      }
    );

    // 6. Delete used OTP
    await db.collection("email_verification_otps").deleteOne({ _id: otpDoc._id });

    // 7. Retrieve updated user document
    const updatedUser = await db.collection("users").findOne({ _id: userObjectId });

    return NextResponse.json({
      success: true,
      message: "Email address changed and verified successfully!",
      data: {
        user: {
          _id: updatedUser?._id.toString() || currentUser._id,
          name: updatedUser?.name || currentUser.name,
          email: updatedUser?.email || newEmail,
          gender: updatedUser?.gender || currentUser.gender,
          dateOfBirth: updatedUser?.dateOfBirth || currentUser.dateOfBirth,
          phone: updatedUser?.phone || currentUser.phone || "",
          address: updatedUser?.address || currentUser.address || "",
          avatar: updatedUser?.avatar || currentUser.avatar,
          role: updatedUser?.role || currentUser.role,
          isEmailVerified: true,
          rewardPoints: updatedUser?.rewardPoints || currentUser.rewardPoints || 0,
        },
      },
    });
  } catch (err: unknown) {
    console.error("[Verify Email OTP Error]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}
