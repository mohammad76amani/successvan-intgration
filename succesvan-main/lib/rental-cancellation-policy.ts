import type { Reservation } from "@/types/type";
import { createLondonDateTime, parseStorageDate } from "@/lib/englandTime";

export type CancellationWindow =
  | "over_72_hours"
  | "between_24_and_72_hours"
  | "under_24_hours";

export type CancellationPaymentOption = "full" | "secure";

const HOURS_24 = 24 * 60 * 60 * 1000;
const HOURS_72 = 72 * 60 * 60 * 1000;

export function cancellationPolicyPercent(
  option: CancellationPaymentOption,
  paidAmount: number,
  millisecondsUntilPickup: number,
) {
  if (millisecondsUntilPickup > HOURS_72) return 0;
  if (millisecondsUntilPickup < HOURS_24) return 100;
  if (option === "secure") return 100;

  if (paidAmount <= 200) return 75;
  if (paidAmount < 500) return 50;
  return 10;
}

export function cancellationWindow(
  millisecondsUntilPickup: number,
): CancellationWindow {
  if (millisecondsUntilPickup > HOURS_72) return "over_72_hours";
  if (millisecondsUntilPickup < HOURS_24) return "under_24_hours";
  return "between_24_and_72_hours";
}

export function calculateRentalCancellation(input: {
  option: CancellationPaymentOption;
  paidAmount: number;
  pickupAt: Date;
  canceledAt?: Date;
  agreedDeductionPercent?: number;
}) {
  const canceledAt = input.canceledAt ?? new Date();
  const paidAmount = Math.max(0, Number(input.paidAmount) || 0);
  const millisecondsUntilPickup = input.pickupAt.getTime() - canceledAt.getTime();
  const policyDeductionPercent = cancellationPolicyPercent(
    input.option,
    paidAmount,
    millisecondsUntilPickup,
  );
  const agreedDeductionPercent = Math.min(
    100,
    Math.max(
      0,
      input.agreedDeductionPercent ?? policyDeductionPercent,
    ),
  );
  const deductionAmount =
    Math.round(paidAmount * (agreedDeductionPercent / 100) * 100) / 100;
  const refundAmount = Math.round((paidAmount - deductionAmount) * 100) / 100;

  return {
    paymentOption: input.option,
    paidAmount,
    hoursBeforePickup:
      Math.round((millisecondsUntilPickup / (60 * 60 * 1000)) * 100) / 100,
    window: cancellationWindow(millisecondsUntilPickup),
    policyDeductionPercent,
    agreedDeductionPercent,
    deductionAmount,
    refundAmount,
  };
}

export function reservationCancellationCalculation(
  reservation: Reservation,
  agreedDeductionPercent?: number,
) {
  const option = reservation.deposit?.option;
  if (option !== "full" && option !== "secure") return null;
  const paymentRecorded =
    ["paid", "held", "refund_processing"].includes(
      String(reservation.deposit?.status),
    ) ||
    (reservation.deposit?.status === "pending" &&
      Boolean(reservation.deposit?.receiptUrl));
  if (!paymentRecorded) return null;

  const secureAmount = Number(
    (reservation.category as { deposit?: { securePayPrice?: number } })?.deposit
      ?.securePayPrice || 0,
  );
  const paidAmount =
    Number(reservation.deposit?.amount || 0) ||
    (option === "full" ? Number(reservation.totalPrice || 0) : secureAmount);
  if (paidAmount <= 0) return null;

  const pickupDay = parseStorageDate(reservation.startDateDisplay);
  const pickupAt =
    pickupDay && reservation.pickupTime
      ? new Date(createLondonDateTime(pickupDay, reservation.pickupTime))
      : new Date(reservation.startDate);
  const canceledAtValue = [...(reservation.statusHistory || [])]
    .reverse()
    .find((entry) => entry.status === "canceled")?.changedAt;

  return {
    ...calculateRentalCancellation({
    option,
    paidAmount,
    pickupAt,
    canceledAt: canceledAtValue ? new Date(canceledAtValue) : new Date(),
    agreedDeductionPercent,
    }),
    status: "pending" as const,
  };
}
