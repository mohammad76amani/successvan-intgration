export type RefundAdditionalCharge = {
  amount: number;
  reason: string;
  evidenceUrl?: string;
  ticketReference?: string;
  violationDate?: Date;
  vehicleNumber?: string;
  source: "traffic_violation" | "manual";
};

const optionalText = (value: unknown) =>
  String(value || "").trim() || undefined;

export const normalizeRefundAdditionalCharges = (
  values: unknown,
): RefundAdditionalCharge[] => {
  if (!Array.isArray(values)) return [];
  return values.map((raw) => {
    const item = (raw || {}) as Record<string, unknown>;
    const parsedDate = item.violationDate
      ? new Date(String(item.violationDate))
      : undefined;
    return {
      amount: Math.round(Math.max(0, Number(item.amount) || 0) * 100) / 100,
      reason: String(item.reason || "").trim(),
      evidenceUrl: optionalText(item.evidenceUrl),
      ticketReference: optionalText(item.ticketReference),
      violationDate:
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate
          : undefined,
      vehicleNumber: optionalText(item.vehicleNumber),
      source:
        item.source === "traffic_violation" ? "traffic_violation" : "manual",
    };
  });
};
