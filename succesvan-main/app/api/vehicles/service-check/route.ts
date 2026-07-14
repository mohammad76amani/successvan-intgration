import { NextRequest } from "next/server";
import connect from "@/lib/data";
import Vehicle from "@/model/vehicle";
import User from "@/model/user";
import { sendSMS } from "@/lib/sms";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const isManualTrigger = !authHeader;
    
    if (!isManualTrigger && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return errorResponse("Unauthorized", 401);
    }

    await connect();

    const vehicles = await Vehicle.find({ status: "active" }).populate("category");
    const now = new Date();
    const results = { checked: 0, needsService: 0, smsCount: 0 };

    for (const vehicle of vehicles) {
      results.checked++;
      const category = vehicle.category as any;
      if (!category?.servicesPeriod) continue;

      const services = ["tyre", "oil", "coolant", "breakes", "service", "adBlue"];
      const overdueServices: string[] = [];

      for (const serviceType of services) {
        const lastService = vehicle.serviceHistory?.[serviceType];
        const periodDays = category.servicesPeriod[serviceType];
        
        if (lastService && periodDays) {
          const daysSinceService = Math.floor((now.getTime() - new Date(lastService).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceService >= periodDays) {
            overdueServices.push(serviceType);
          }
        }
      }

      if (overdueServices.length > 0) {
        vehicle.needsService = true;
        await vehicle.save();
        results.needsService++;

        // Send SMS to admins
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          if (admin.phoneData?.phoneNumber) {
            try {
              await sendSMS(
                admin.phoneData.phoneNumber.replace("+", ""),
                `Vehicle ${vehicle.number} needs service: ${overdueServices.join(", ")}. SuccessVanHire.co.uk`
              );
              results.smsCount++;
            } catch (error) {
              console.log(`Service SMS Error (${admin.phoneData.phoneNumber}):`, error);
            }
          }
        }
      } else if (vehicle.needsService) {
        vehicle.needsService = false;
        await vehicle.save();
      }
    }

    return successResponse(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
