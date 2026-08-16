export type ContractMileageAddOn = {
  addOn?: {
    name?: string;
    type?: string;
  };
  quantity?: number;
};

const BASE_DAILY_MILES = 150;
const BASE_WEEKLY_MILES = 1_000;

function isMileageAddOn(addOn?: ContractMileageAddOn["addOn"]) {
  const name = String(addOn?.name || "").toLowerCase();
  const type = String(addOn?.type || "").toLowerCase();
  return type === "mileage" || name.includes("mileage");
}

function mileageFromName(name?: string) {
  const match = String(name || "").match(/([\d,]+)\s*miles?/i);
  if (!match) return 0;
  const miles = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(miles) ? miles : 0;
}

function milesLabel(miles: number) {
  return `${miles.toLocaleString("en-GB")} miles`;
}

export function contractMileageAllowance(addOns: ContractMileageAddOn[] = []) {
  const mileageAddOns = addOns.filter((item) => isMileageAddOn(item.addOn));
  const unlimited = mileageAddOns.some((item) =>
    String(item.addOn?.name || "").toLowerCase().includes("unlimited"),
  );

  if (unlimited) {
    return {
      unlimited: true,
      dailyMiles: null,
      weeklyMiles: null,
      dailyLabel: "Unlimited",
      weeklyLabel: "Unlimited",
      excessChargeLabel: "Not applicable",
    };
  }

  const additionalDailyMiles = mileageAddOns.reduce((total, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    return total + mileageFromName(item.addOn?.name) * quantity;
  }, 0);
  const dailyMiles = BASE_DAILY_MILES + additionalDailyMiles;
  const weeklyMiles = BASE_WEEKLY_MILES + additionalDailyMiles * 7;

  return {
    unlimited: false,
    dailyMiles,
    weeklyMiles,
    dailyLabel: milesLabel(dailyMiles),
    weeklyLabel: milesLabel(weeklyMiles),
    excessChargeLabel: "25p per mile",
  };
}
