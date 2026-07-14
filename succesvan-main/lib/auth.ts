import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function verifyToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("No token provided");

  return jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as {
    userId: string;
    role: string;
  };
}

export function requireAuth(req: NextRequest) {
  try {
    return verifyToken(req);
  } catch (error) {
    throw new Error("Unauthorized");
  }
}
