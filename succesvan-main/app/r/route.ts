import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    request.nextUrl.origin;

  return NextResponse.redirect(
    new URL("/customerDashboard#reserves", siteUrl),
  );
}
