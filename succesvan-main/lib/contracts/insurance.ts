export type ContractInsuranceProvider = "diba" | "customer";

export type ContractInsuranceAddOn = {
  addOn?: {
    name?: string;
    type?: string;
  };
  quantity?: number;
};

export function contractInsuranceAddOns(
  addOns: ContractInsuranceAddOn[] = [],
) {
  const labels = addOns.flatMap((item) => {
    const name = String(item.addOn?.name || "").trim();
    const normalizedName = name.toLowerCase();
    const normalizedType = String(item.addOn?.type || "").toLowerCase();
    const isInsuranceAddOn =
      normalizedType !== "mileage" &&
      (normalizedType.includes("insurance") ||
        normalizedType.includes("excess") ||
        normalizedName.includes("insurance") ||
        normalizedName.includes("excess protection"));

    if (!name || !isInsuranceAddOn) return [];
    const quantity = Math.max(1, Number(item.quantity || 1));
    return [quantity > 1 ? `${name} x ${quantity}` : name];
  });

  return labels.length > 0 ? labels.join(", ") : "-";
}

export function contractInsuranceValues({
  provider,
  licenceHolderName,
  selectedInsuranceAddOns,
  otherExcess,
}: {
  provider?: ContractInsuranceProvider;
  licenceHolderName: string;
  selectedInsuranceAddOns?: string;
  otherExcess?: string;
}) {
  return {
    arrangedBy:
      provider === "customer"
        ? licenceHolderName.toUpperCase()
        : "Diba Cooperation Ltd",
    glassWindscreenExcess: "£250",
    insuranceExcess: selectedInsuranceAddOns || "-",
    otherExcess: otherExcess?.trim() || "-",
  };
}
