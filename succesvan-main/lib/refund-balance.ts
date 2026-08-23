type RefundBalanceInput = {
  depositPaid?: number;
  deductionsTotal?: number;
  refundAmount?: number;
};

const finiteNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

export function calculateRefundBalance(
  refund?: RefundBalanceInput,
  fallbackDeposit?: number,
) {
  const depositPaid = finiteNumber(refund?.depositPaid ?? fallbackDeposit);
  const deductionsTotal = finiteNumber(refund?.deductionsTotal);

  if (depositPaid !== undefined && deductionsTotal !== undefined) {
    return Math.round((depositPaid - deductionsTotal) * 100) / 100;
  }

  return Math.round((finiteNumber(refund?.refundAmount) ?? 0) * 100) / 100;
}
