export const dynamic = "force-dynamic";

// Trusted server time - clients use this instead of the device clock,
// which users can change to bypass past-date restrictions.
export async function GET() {
  const now = new Date();
  return Response.json(
    {
      success: true,
      serverTime: now.toISOString(),
      timestamp: now.getTime(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
