import { NextRequest } from "next/server";
import connect from "@/lib/data";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const { phoneNumber } = await req.json();

    const user = await User.findOne({
      "phoneData.phoneNumber": phoneNumber,
    }).select("-password");

    if (user) {
      return successResponse({ exists: true, user });
    }

    return successResponse({ exists: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
