import { NextRequest } from "next/server";
import connect from "@/lib/data";
import { requireAuth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/roles";
import { successResponse, errorResponse } from "@/lib/api-response";
import User from "@/model/user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = requireAuth(req);
    if (!canAccessDashboard(auth.role)) {
      return errorResponse("Admin access is required", 403);
    }
    const { id } = await params;
    const body = await req.json();
    const reason = String(body.reason || "Debt settled by admin").trim();
    await connect();
    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "debtFlag.active": false,
          "debtFlag.amount": 0,
          "debtFlag.reason": reason,
          "debtFlag.clearedAt": new Date(),
          "debtFlag.clearedBy": auth.userId,
        },
      },
      { new: true, runValidators: true },
    ).select("name lastName phoneData debtFlag");
    if (!user) return errorResponse("Customer not found", 404);
    return successResponse(user);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse(
      error instanceof Error ? error.message : "Could not clear debt flag",
      500,
    );
  }
}
