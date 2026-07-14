import { NextRequest } from "next/server";
import connect from "@/lib/data";
import User from "@/model/user";
import Verification from "@/model/verification";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const body = await req.json();
    const { action, phoneNumber, code, name, lastName, emailAddress, licenceAttached, address, postalCode, city, isAdminMode } = body;

    if (action === "send-code") {
      if (!phoneNumber) return errorResponse("Phone number required", 400);

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await Verification.findOneAndUpdate(
        { phoneNumber },
        { code: verificationCode, expiresAt, verified: false },
        { upsert: true, new: true }
      );

      try {
        await sendSMS(
          phoneNumber.replace("+", ""),
          `SuccessVanHire verification code is: ${verificationCode}
          successvanhire.co.uk`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.log("SMS Error:", message);
      }
      console.log(`[DEV] Code for ${phoneNumber}: ${verificationCode}`);
      return successResponse({ message: "Code sent"});
    }

    if (action === "verify") {
      if (!phoneNumber || !code)
        return errorResponse("Phone and code required", 400);

      const verification = await Verification.findOne({
        phoneNumber,
        verified: false,
      });
      if (!verification || verification.code !== code)
        return errorResponse("Invalid code", 400);
      if (verification.expiresAt < new Date())
        return errorResponse("Code expired", 400);

      verification.verified = true;
      await verification.save();

      const user = await User.findOne({ "phoneData.phoneNumber": phoneNumber });

      if (user) {
        const token = jwt.sign(
          { userId: user._id, role: user.role },
          process.env.NEXT_PUBLIC_JWT_SECRET!,
          { expiresIn: "28d" }
        );
        return successResponse({ userExists: true, token, user });
      }

      return successResponse({ userExists: false, phoneVerified: true });
    }

    if (action === "register") {
      if (!phoneNumber || !name || !lastName || (!isAdminMode && !emailAddress))
        return errorResponse("All fields required", 400);

      // Skip phone verification check if admin is creating the user
      if (!isAdminMode) {
        const verification = await Verification.findOne({
          phoneNumber,
          verified: true,
        });
        if (!verification) return errorResponse("Phone not verified", 400);
      }

      const existingUser = await User.findOne({
        "phoneData.phoneNumber": phoneNumber,
      });
      if (existingUser) return errorResponse("User already exists", 400);

      const finalEmailAddress =
        emailAddress?.trim() ||
        (isAdminMode
          ? `admin-created-${phoneNumber.replace(/\D/g, "")}@successvan.local`
          : "");

      if (finalEmailAddress) {
        const existingEmailUser = await User.findOne({
          "emaildata.emailAddress": finalEmailAddress,
        });
        if (existingEmailUser) return errorResponse("Email already exists", 409);
      }

      const userData: Record<string, unknown> = {
        name,
        lastName,
        emaildata: { emailAddress: finalEmailAddress, isVerified: false },
        phoneData: { phoneNumber, isVerified: true },
      };

      // Add optional fields if provided
      if (licenceAttached) {
        userData.licenceAttached = licenceAttached;
      }
      if (address) {
        userData.address = address;
      }
      if (postalCode) {
        userData.postalCode = postalCode;
      }
      if (city) {
        userData.city = city;
      }

      const user = await User.create(userData);

      if (isAdminMode) {
        return successResponse({ user }, 201);
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.NEXT_PUBLIC_JWT_SECRET!,
        { expiresIn: "28d" }
      );
      return successResponse({ token, user }, 201);
    }

    return errorResponse("Invalid action", 400);
  } catch (error) {
    console.log("Auth route error:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse("A customer with this phone or email already exists", 409);
    }
    const message = error instanceof Error ? error.message : "Invalid Data";
    return errorResponse(message, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    await connect();

    const user = await User.findById(auth.userId).select("-password").lean();
    if (!user) return errorResponse("User not found", 404);

    return successResponse(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(
      message === "Unauthorized" ? "Unauthorized" : message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
