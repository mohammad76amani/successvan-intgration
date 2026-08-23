// Company payment details shown to customers for deposit bank transfers.
// Override via NEXT_PUBLIC_* env vars without touching code.

export const DEPOSIT_PAYMENT_DETAILS = {
  bankName:
    process.env.NEXT_PUBLIC_DEPOSIT_BANK_NAME || "Lloyds Business Bank",
  accountName:
    process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME || "Diba Cooperation Ltd",
  sortCode: process.env.NEXT_PUBLIC_DEPOSIT_SORT_CODE || "30-99-09",
  accountNumber: process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NUMBER || "44761060",
};
