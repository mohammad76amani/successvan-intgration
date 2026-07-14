/**
 * Add-ons Report Builder
 * Reusable function for generating add-on usage statistics
 */

import connect from "@/lib/data";
import Reservation from "@/model/reservation";

export interface AddOnReportResult {
  addOns: Array<{
    _id: string;
    name: string;
    usageCount: number;
    totalRevenue: number;
    avgUsagePerReservation: number;
    topCustomer: string;
    topCustomerUsage: number;
  }>;
  customerUsage: Array<{
    customerName: string;
    addOnName: string;
    usageCount: number;
    totalSpent: number;
  }>;
  summary: {
    totalAddOns: number;
    totalAddOnRevenue: number;
    avgAddOnsPerReservation: number;
    reservationsWithAddOns: number;
    totalReservationsForAddOns: number;
    mostUsedAddOn: any;
    leastUsedAddOn: any;
  };
}

export async function buildAddOnsReport(
  startDate?: string,
  endDate?: string
): Promise<AddOnReportResult> {
  await connect();

  // Build query with optional date filter
  const query: any = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  }

  const reservations = await Reservation.find(query)
    .populate("user", "name")
    .populate("addOns.addOn")
    .lean();

  const addOnStats: { [key: string]: any } = {};
  const customerAddOnUsage: any[] = [];
  let totalAddOnCount = 0;
  let reservationsWithAddOns = 0;

  reservations.forEach((res: any) => {
    if (res.addOns && Array.isArray(res.addOns) && res.addOns.length > 0) {
      // Check if this reservation has at least one valid add-on
      const hasValidAddOn = res.addOns.some((item: any) => item.addOn);
      if (hasValidAddOn) {
        reservationsWithAddOns++;
      }

      res.addOns.forEach((item: any) => {
        const addOn = item.addOn;
        if (addOn) {
          const addOnId = addOn._id.toString();
          const addOnName = addOn.name;

          if (!addOnStats[addOnId]) {
            addOnStats[addOnId] = {
              _id: addOnId,
              name: addOnName,
              usageCount: 0,
              totalRevenue: 0,
              customerUsage: {},
            };
          }

          const quantity = item.quantity || 1;
          const price = addOn.flatPrice || 0;
          const revenue = price * quantity;

          addOnStats[addOnId].usageCount += quantity;
          addOnStats[addOnId].totalRevenue += revenue;
          totalAddOnCount += quantity;

          const customerName = res.user?.name || "Unknown";
          if (!addOnStats[addOnId].customerUsage[customerName]) {
            addOnStats[addOnId].customerUsage[customerName] = {
              count: 0,
              spent: 0,
            };
          }
          addOnStats[addOnId].customerUsage[customerName].count += quantity;
          addOnStats[addOnId].customerUsage[customerName].spent += revenue;

          customerAddOnUsage.push({
            customerName,
            addOnName,
            usageCount: quantity,
            totalSpent: revenue,
          });
        }
      });
    }
  });

  const addOnsArray = Object.values(addOnStats).map((addon: any) => {
    const topCustomer = Object.entries(addon.customerUsage).sort(
      (a: any, b: any) => b[1].count - a[1].count
    )[0] as [string, { count: number; spent: number }] | undefined;

    return {
      _id: addon._id,
      name: addon.name,
      usageCount: addon.usageCount,
      totalRevenue: addon.totalRevenue,
      avgUsagePerReservation:
        reservations.length > 0 ? addon.usageCount / reservations.length : 0,
      topCustomer: topCustomer ? topCustomer[0] : "N/A",
      topCustomerUsage: topCustomer ? topCustomer[1].count : 0,
    };
  });

  const sortedByUsage = [...addOnsArray].sort(
    (a: any, b: any) => b.usageCount - a.usageCount
  );

  return {
    addOns: sortedByUsage,
    customerUsage: customerAddOnUsage.sort((a, b) => b.totalSpent - a.totalSpent),
    summary: {
      totalAddOns: addOnsArray.length,
      totalAddOnRevenue: addOnsArray.reduce(
        (sum: number, a: any) => sum + a.totalRevenue,
        0
      ),
      avgAddOnsPerReservation:
        reservations.length > 0 ? totalAddOnCount / reservations.length : 0,
      reservationsWithAddOns,
      totalReservationsForAddOns: reservations.length,
      mostUsedAddOn: sortedByUsage[0] || null,
      leastUsedAddOn: sortedByUsage[sortedByUsage.length - 1] || null,
    },
  };
}
