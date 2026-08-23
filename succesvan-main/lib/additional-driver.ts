export type AddOnLike = {
  name?: unknown;
  type?: unknown;
};

export type ReservationAddOnLike = {
  addOn?: AddOnLike | string | null;
};

const normalize = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const isAdditionalDriverAddOn = (addOn?: AddOnLike | null) => {
  if (!addOn) return false;
  const values = [normalize(addOn.name), normalize(addOn.type)];
  return values.some(
    (value) =>
      value === "additional driver" ||
      value === "additionaldriver" ||
      value.includes("additional driver"),
  );
};

export const hasAdditionalDriverAddOn = (
  items?: ReservationAddOnLike[] | null,
) =>
  Boolean(
    items?.some(
      (item) =>
        typeof item?.addOn === "object" &&
        isAdditionalDriverAddOn(item.addOn),
    ),
  );

export const validateAdditionalDriver = (
  items: ReservationAddOnLike[] | null | undefined,
  details?: { name?: unknown; licenceNumber?: unknown } | null,
) => {
  if (!hasAdditionalDriverAddOn(items)) return null;
  const name = String(details?.name || "").trim();
  const licenceNumber = String(details?.licenceNumber || "").trim();
  if (!name || !licenceNumber) {
    throw new Error(
      "Enter the additional driver's full name and driving licence number.",
    );
  }
  return { name, licenceNumber };
};
