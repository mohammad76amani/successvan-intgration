export type ReservationExtensionPricingInput = {
  currentReturn: Date | string;
  newReturn: Date | string;
  pricingTiers: Array<{
    minDays: number;
    maxDays: number;
    pricePerDay: number;
  }>;
  extraHoursRate?: number;
  sellOfferPercent?: number;
  gearExtraCostPerDay?: number;
  returnExtensionPrice?: number;
  specialDays?: Array<{
    month: number;
    day: number;
    extraPrice?: number;
    reason?: string;
  }>;
  addOns?: Array<{
    quantity?: number;
    selectedTierIndex?: number;
    addOn?: {
      pricingType?: "flat" | "tiered";
      flatPrice?: { amount?: number; isPerDay?: boolean };
      tieredPrice?: {
        isPerDay?: boolean;
        tiers?: Array<{ price?: number }>;
      };
    };
  }>;
};

export type ReservationExtensionPricingResult = {
  durationHours: number;
  totalDays: number;
  extraHours: number;
  pricePerDay: number;
  daysPrice: number;
  extraHoursPrice: number;
  gearPrice: number;
  addOnsPrice: number;
  returnExtensionPrice: number;
  specialDaysPrice: number;
  totalPrice: number;
  durationLabel: string;
  breakdown: Array<{ label: string; amount: number }>;
};

const money = (value: unknown) => Math.max(0, Number(value) || 0);

const londonWallClockTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
  );
};

export function getLondonSpecialDayCharges(
  currentReturn: Date,
  newReturn: Date,
  specialDays: ReservationExtensionPricingInput["specialDays"] = [],
) {
  const start = new Date(londonWallClockTime(currentReturn));
  const end = new Date(londonWallClockTime(newReturn));
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  const charges: Array<{ label: string; amount: number }> = [];
  for (
    const day = new Date(start);
    day <= end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const specialDay = specialDays.find(
      (item) =>
        item.month === day.getUTCMonth() + 1 && item.day === day.getUTCDate(),
    );
    const amount = money(specialDay?.extraPrice);
    if (amount <= 0) continue;
    const dateLabel = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(day);
    charges.push({
      label: `${specialDay?.reason || "Special day"} (${dateLabel})`,
      amount,
    });
  }
  return charges;
}

export function calculateReservationExtensionPrice(
  input: ReservationExtensionPricingInput,
): ReservationExtensionPricingResult {
  const currentReturn = new Date(input.currentReturn);
  const newReturn = new Date(input.newReturn);
  if (
    Number.isNaN(currentReturn.getTime()) ||
    Number.isNaN(newReturn.getTime()) ||
    newReturn <= currentReturn
  ) {
    throw new Error(
      "The new return date must be after the current return date",
    );
  }
  if (!input.pricingTiers.length) {
    throw new Error("The reservation category does not have pricing tiers");
  }

  const exactMinutes =
    (londonWallClockTime(newReturn) - londonWallClockTime(currentReturn)) /
    60_000;
  const wholeHours = Math.floor(exactMinutes / 60);
  const remainingMinutes = exactMinutes % 60;
  const billableHours = remainingMinutes > 15 ? wholeHours + 1 : wholeHours;
  if (billableHours <= 0) {
    throw new Error("The extension must be at least one billable hour");
  }

  let totalDays: number;
  let extraHours: number;
  if (billableHours < 24) {
    totalDays = 1;
    extraHours = 0;
  } else {
    totalDays = Math.floor(billableHours / 24);
    extraHours = billableHours % 24;
    if (extraHours > 6) {
      totalDays += 1;
      extraHours = 0;
    }
  }

  const tier =
    input.pricingTiers.find(
      (item) => totalDays >= item.minDays && totalDays <= item.maxDays,
    ) || input.pricingTiers[input.pricingTiers.length - 1];
  const discount = Math.min(100, money(input.sellOfferPercent));
  const pricePerDay =
    money(tier.pricePerDay) * (discount > 0 ? 1 - discount / 100 : 1);
  const daysPrice = totalDays * pricePerDay;
  const extraHoursPrice = extraHours * money(input.extraHoursRate);
  const gearPrice = totalDays * money(input.gearExtraCostPerDay);
  const addOnsPrice = (input.addOns || []).reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const addOn = item.addOn;
    if (!addOn) return sum;
    if (addOn.pricingType === "flat") {
      return addOn.flatPrice?.isPerDay
        ? sum + money(addOn.flatPrice.amount) * totalDays * quantity
        : sum;
    }
    if (!addOn.tieredPrice?.isPerDay) return sum;
    const tierIndex = Number(item.selectedTierIndex);
    const selectedTier = Number.isInteger(tierIndex)
      ? addOn.tieredPrice.tiers?.[tierIndex]
      : addOn.tieredPrice.tiers?.[0];
    return sum + money(selectedTier?.price) * totalDays * quantity;
  }, 0);
  const returnExtensionPrice = money(input.returnExtensionPrice);
  const specialDayCharges = getLondonSpecialDayCharges(
    currentReturn,
    newReturn,
    input.specialDays,
  );
  const specialDaysPrice = specialDayCharges.reduce(
    (total, charge) => total + charge.amount,
    0,
  );
  const totalPrice = Number(
    (
      daysPrice +
      extraHoursPrice +
      gearPrice +
      addOnsPrice +
      returnExtensionPrice +
      specialDaysPrice
    ).toFixed(2),
  );
  const durationHours = Number((exactMinutes / 60).toFixed(2));
  const durationParts = [
    totalDays > 0 ? `${totalDays} day${totalDays === 1 ? "" : "s"}` : "",
    extraHours > 0
      ? `${extraHours} extra hour${extraHours === 1 ? "" : "s"}`
      : "",
  ].filter(Boolean);

  return {
    durationHours,
    totalDays,
    extraHours,
    pricePerDay: Number(pricePerDay.toFixed(2)),
    daysPrice: Number(daysPrice.toFixed(2)),
    extraHoursPrice: Number(extraHoursPrice.toFixed(2)),
    gearPrice: Number(gearPrice.toFixed(2)),
    addOnsPrice: Number(addOnsPrice.toFixed(2)),
    returnExtensionPrice,
    specialDaysPrice,
    totalPrice,
    durationLabel: durationParts.join(" and "),
    breakdown: [
      {
        label: `${totalDays} day${totalDays === 1 ? "" : "s"} hire`,
        amount: daysPrice,
      },
      ...(extraHoursPrice > 0
        ? [
            {
              label: `${extraHours} additional hour${extraHours === 1 ? "" : "s"}`,
              amount: extraHoursPrice,
            },
          ]
        : []),
      ...(gearPrice > 0
        ? [{ label: "Automatic gear", amount: gearPrice }]
        : []),
      ...(addOnsPrice > 0
        ? [{ label: "Per-day add-ons", amount: addOnsPrice }]
        : []),
      ...(returnExtensionPrice > 0
        ? [{ label: "Out-of-hours return", amount: returnExtensionPrice }]
        : []),
      ...specialDayCharges,
    ],
  };
}
