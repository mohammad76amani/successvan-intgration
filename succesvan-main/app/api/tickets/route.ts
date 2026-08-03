import { NextRequest, NextResponse } from "next/server";
import Ticket from "@/model/ticket";
import connect from "@/lib/data";
import jwt from "jsonwebtoken";
import User from "@/model/user";
import { canAccessDashboard } from "@/lib/roles";
import { withLastReservations } from "@/lib/ticketLastReservation";

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
    const userId = decoded.userId;
    const userRole = decoded.role;

    // Get user from database to check current role
    const user = await User.findById(userId);

    // Check if JWT role matches database role
    if (user && userRole !== user.role) {
      return NextResponse.json({
        error: "Authentication expired. Please log out and log back in.",
        details: "Your role has been updated. Please refresh your session.",
      }, { status: 403 });
    }

    let tickets;
    if (canAccessDashboard(userRole)) {
      const ticketList = await Ticket.find()
        .populate("userId", "name lastName email emaildata phoneData")
        .sort({ updatedAt: -1 })
        .lean();
      tickets = await withLastReservations(ticketList);
    } else {
      tickets = await Ticket.find({ userId }).sort({ updatedAt: -1 });
    }

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.log("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const userId = decoded.userId;

    const { subject, message, priority } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    const ticket = new Ticket({
      userId,
      subject,
      priority: priority || "medium",
      messages: [
        {
          sender: userId,
          content: message,
          timestamp: new Date(),
        },
      ],
    });

    await ticket.save();

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.log("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
