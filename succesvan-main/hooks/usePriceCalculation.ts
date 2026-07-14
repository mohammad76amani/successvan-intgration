import { useState, useEffect } from "react";

interface PricingTier {
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

interface PriceCalculationResult {
  totalHours: number;
  totalDays: number;
  extraHours: number;
  pricePerDay: number;
  extraHoursRate: number;
  totalPrice: number;
  breakdown: string;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  addOnsPrice?: number;
  specialDaysPrice?: number;
  specialDaysInfo?: Array<{
    date: string;
    price: number;
    reason?: string;
  }>;
}

export function usePriceCalculation(
  startDate: string,
  endDate: string,
  pricingTiers: PricingTier[],
  extraHoursRate: number = 0,
  pickupExtensionPrice: number = 0,
  returnExtensionPrice: number = 0,
  gearExtraCostPerDay: number = 0,
  addOnsPrice: number = 0,
  sellOffer: number = 0,
  specialDays: Array<{
    month: number;
    day: number;
    extraPrice?: number;
    reason?: string;
  }> = []
): PriceCalculationResult | null {
  const [result, setResult] = useState<PriceCalculationResult | null>(null);

  useEffect(() => {
    console.log('usePriceCalculation received extraHoursRate:', extraHoursRate);
    if (!startDate || !endDate || !pricingTiers || pricingTiers.length === 0) {
      setResult(null);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setResult(null);
      return;
    }

    console.log('=== Date Parsing ===');
    console.log('Raw Start Date:', startDate);
    console.log('Raw End Date:', endDate);
    console.log('Parsed Start:', start.toISOString());
    console.log('Parsed End:', end.toISOString());
    console.log('Start Time:', start.toLocaleTimeString());
    console.log('End Time:', end.toLocaleTimeString());
    console.log('===================');

    const diffTime = end.getTime() - start.getTime();
    const totalMinutes = diffTime / (1000 * 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    // If minutes > 15, count as extra hour; if <= 15, ignore
    const billableHours = remainingMinutes > 15 ? totalHours + 1 : totalHours;

    if (billableHours <= 0) {
      setResult(null);
      return;
    }

    // Calculate total days based on user's pricing rules:
    // - Reservations less than 24 hours count as 1 day
    // - Reservations over 6 hours but spanning multiple days count extra hours > 6 as 1 full day
    let totalDays: number;
    let extraHours: number;

    if (billableHours < 24) {
      // Less than 24 hours counts as 1 day
      totalDays = 1;
      extraHours = 0;
    } else {
      // More than 24 hours: full days + check extra hours
      totalDays = Math.floor(billableHours / 24);
      extraHours = billableHours % 24;

      // If extra hours > 6, count as 1 additional day
      if (extraHours > 6) {
        totalDays += 1;
        extraHours = 0;
      }
    }

    // Find the appropriate pricing tier based on days
    const tier = pricingTiers.find(
      (t) => totalDays >= t.minDays && totalDays <= t.maxDays
    ) || pricingTiers[pricingTiers.length - 1];

    let pricePerDay = tier.pricePerDay;
    if (sellOffer && sellOffer > 0) {
      pricePerDay = pricePerDay * (1 - sellOffer / 100);
    }

    // Calculate total price: (days * pricePerDay) + (days * gearExtraCost) + (extraHours * extraHoursRate) + extensions + addons + specialDays
    const daysPrice = totalDays * pricePerDay;
    const gearExtraPrice = totalDays * gearExtraCostPerDay;
    const extraHoursPrice = extraHours * extraHoursRate;

    // Calculate special days price
    let specialDaysPrice = 0;
    const specialDaysInfo: Array<{ date: string; price: number; reason?: string }> = [];

    if (specialDays && specialDays.length > 0) {
      const startDateObj = new Date(start);
      const endDateObj = new Date(end);

      // Loop through each day in the rental period
      const currentDate = new Date(startDateObj);

      while (currentDate <= endDateObj) {
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();

        // Check if this date is a special day
        const specialDay = specialDays.find(
          (sd) => sd.month === month && sd.day === day
        );

        if (specialDay && specialDay.extraPrice && specialDay.extraPrice > 0) {
          specialDaysPrice += specialDay.extraPrice;
          specialDaysInfo.push({
            date: `${month}/${day}`,
            price: specialDay.extraPrice,
            reason: specialDay.reason,
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const totalPrice = daysPrice + gearExtraPrice + extraHoursPrice + pickupExtensionPrice + returnExtensionPrice + addOnsPrice + specialDaysPrice;

    // Build breakdown
    let breakdown = "";
    if (totalDays > 0 && extraHours > 0) {
      breakdown = `(${totalDays} day${totalDays > 1 ? 's' : ''} × £${pricePerDay}) + (${extraHours}h × £${extraHoursRate})`;
    } else if (totalDays > 0) {
      breakdown = `(${totalDays} day${totalDays > 1 ? 's' : ''} × £${pricePerDay})`;
    } else {
      breakdown = `(${extraHours}h × £${extraHoursRate})`;
    }

    if (pickupExtensionPrice > 0) {
      breakdown += ` + (Pickup Extension £${pickupExtensionPrice} - either out of working time or weekend time)`;
    }
    if (returnExtensionPrice > 0) {
      breakdown += ` + (Return Extension £${returnExtensionPrice} - either out of working time or weekend time)`;
    }

    if (gearExtraCostPerDay > 0) {
      breakdown += ` + (${totalDays} day${totalDays > 1 ? 's' : ''} × £${gearExtraCostPerDay} Gear)`;
    }

    if (addOnsPrice > 0) {
      breakdown += ` + (Add-ons £${addOnsPrice})`;
    }

    if (specialDaysPrice > 0) {
      breakdown += ` + (Special Days £${specialDaysPrice})`;
    }

    // Log calculation details
    console.log('=== Price Calculation ===');
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Total Minutes:', totalMinutes);
    console.log('Remaining Minutes:', remainingMinutes);
    console.log('Billable Hours:', billableHours);
    console.log('Total Days:', totalDays);
    console.log('Extra Hours:', extraHours);
    console.log('Price Per Day:', `£${pricePerDay}`);
    console.log('Extra Hours Rate:', `£${extraHoursRate}`);
    console.log('Days Price:', `£${daysPrice}`);
    console.log('Gear Extra Price:', `£${gearExtraPrice}`);
    console.log('Extra Hours Price:', `£${extraHoursPrice}`);
    console.log('Pickup Extension Price:', `£${pickupExtensionPrice}`);
    console.log('Return Extension Price:', `£${returnExtensionPrice}`);
    console.log('Special Days Price:', `£${specialDaysPrice}`);
    console.log('Special Days Info:', specialDaysInfo);
    console.log('Total Price:', `£${totalPrice}`);
    console.log('Breakdown:', breakdown);
    console.log('========================');

    setResult({
      totalHours: billableHours,
      totalDays,
      extraHours,
      pricePerDay,
      extraHoursRate,
      totalPrice,
      breakdown,
      pickupExtensionPrice,
      returnExtensionPrice,
      addOnsPrice,
      specialDaysPrice,
      specialDaysInfo,
    });
  }, [startDate, endDate, JSON.stringify(pricingTiers), extraHoursRate, pickupExtensionPrice, returnExtensionPrice, gearExtraCostPerDay, addOnsPrice, sellOffer, JSON.stringify(specialDays)]);

  return result;
}
