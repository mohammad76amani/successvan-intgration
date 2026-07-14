import connect from "@/lib/data";
import Office from "@/model/office";
import Vehicle from "@/model/vehicle";
import AddOn from "@/model/addOn";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await connect();

    const [offices, vehicles, addOns] = await Promise.all([
      Office.find().populate("cars.car"),
      Vehicle.find().populate("category"),
      AddOn.find(),
    ]);

    return successResponse({ offices, vehicles, addOns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
