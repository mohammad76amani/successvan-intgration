import { NextRequest } from "next/server";
import connect from "@/lib/data";
import User from "@/model/user";
import { successResponse, errorResponse } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import bcrypt from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect();
    const { id } = await params;
    const user = await User.findById(id).select("-password").lean();
    if (!user) return errorResponse("User not found", 404);
    return successResponse(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    if (auth.userId !== id && !canAccessDashboard(auth.role)) {
      return errorResponse("Forbidden", 403);
    }

    await connect();
    const body = await req.json();

    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }

    const updateData: Record<string, unknown> = {};
    const unsetData: Record<string, ""> = {};

    const hasField = (field: string) =>
      Object.prototype.hasOwnProperty.call(body, field);

    if (hasField("name")) updateData.name = body.name;
    if (hasField("lastName")) updateData.lastName = body.lastName;
    if (hasField("address")) updateData.address = body.address;
    if (hasField("city")) updateData.city = body.city;
    if (hasField("postalCode")) updateData.postalCode = body.postalCode;
    if (hasField("avatar")) updateData.avatar = body.avatar;
    if (body.email || body.emaildata?.emailAddress) {
      updateData["emaildata.emailAddress"] =
        body.email || body.emaildata.emailAddress;
    }
    if (typeof body.emailVerified === "boolean") {
      updateData["emaildata.isVerified"] = body.emailVerified;
    } else if (typeof body.emaildata?.isVerified === "boolean") {
      updateData["emaildata.isVerified"] = body.emaildata.isVerified;
    }
    if (body.phone || body.phoneData?.phoneNumber) {
      updateData["phoneData.phoneNumber"] =
        body.phone || body.phoneData.phoneNumber;
    }
    if (typeof body.phoneVerified === "boolean") {
      updateData["phoneData.isVerified"] = body.phoneVerified;
    } else if (typeof body.phoneData?.isVerified === "boolean") {
      updateData["phoneData.isVerified"] = body.phoneData.isVerified;
    }
    if (body.password) updateData.password = body.password;
    if (body.role) updateData.role = body.role;
    if (body.licenceAttached) updateData.licenceAttached = body.licenceAttached;
    if (body.licenceDetails) {
      updateData.licenceDetails = {
        ...body.licenceDetails,
        // Accept scans created by the short-lived combined-side client value
        // while storing the schema-compatible primary identity side.
        sourceSide:
          body.licenceDetails.sourceSide === "both"
            ? "front"
            : body.licenceDetails.sourceSide,
        extractedAt: new Date(),
      };
    }
    if (body.deleteAvatar) {
      unsetData.avatar = "";
    }
    if (
      body.deleteLicenceSide === "front" ||
      body.deleteLicenceSide === "back"
    ) {
      unsetData[`licenceAttached.${body.deleteLicenceSide}`] = "";
    }

    const updateOperation: Record<string, Record<string, unknown>> = {};
    if (Object.keys(updateData).length > 0) {
      updateOperation.$set = updateData;
    }
    if (Object.keys(unsetData).length > 0) {
      updateOperation.$unset = unsetData;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateOperation,
      {
        new: true,
        runValidators: true,
        strict: false,
      }
    )
      .select("-password")
      .lean();
    if (!user) return errorResponse("User not found", 404);
    return successResponse(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(
      message === "Unauthorized" ? message : message,
      message === "Unauthorized" ? 401 : 400
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req);
    const { id } = await params;
    if (auth.userId !== id && !canAccessDashboard(auth.role)) {
      return errorResponse("Forbidden", 403);
    }

    await connect();
    const user = await User.findByIdAndDelete(id);
    if (!user) return errorResponse("User not found", 404);
    return successResponse({ message: "User deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(
      message === "Unauthorized" ? message : message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
