import { NextRequest, NextResponse } from "next/server";
import Ticket from "@/model/ticket";
import connect from "@/lib/data";
import jwt from "jsonwebtoken";
import { canAccessDashboard } from "@/lib/roles";

type TokenPayload = {
  userId: string;
  role: string;
};

export async function GET(request: NextRequest) {
  try {
    await connect();
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as TokenPayload;
    const userRole = decoded.role;

    // Count only open and in-progress tickets (optimized - no data payload)
    let openTicketsCount = 0;
    
    if (canAccessDashboard(userRole)) {
      openTicketsCount = await Ticket.countDocuments({
        status: { $in: ["open", "in-progress"] }
      });
    } else {
      // For non-admin users, count only their open tickets
      openTicketsCount = await Ticket.countDocuments({
        userId: decoded.userId,
        status: { $in: ["open", "in-progress"] }
      });
    }

    return NextResponse.json({ success: true, count: openTicketsCount });
  } catch (error) {
    console.log("Error fetching open tickets count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
