import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://successvanhire.co.uk",
  "https://www.successvanhire.co.uk",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:19006",
]);

function getAllowedOrigin(origin: string | null) {
  if (!origin) return "*";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
  return "https://successvanhire.co.uk";
}

function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = getAllowedOrigin(request.headers.get("origin"));

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.set("Vary", "Origin");

  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), request);
  }

  return applyCorsHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: "/api/:path*",
};
