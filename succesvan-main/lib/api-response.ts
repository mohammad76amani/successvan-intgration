import { NextResponse } from "next/server";

export function successResponse(data: any, status = 200) {
  if (data?.pagination) {
    return NextResponse.json(
      { success: true, data: data.data, pagination: data.pagination },
      { status }
    );
  }
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
