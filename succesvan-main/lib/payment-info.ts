// Company payment details shown to customers for deposit bank transfers.
// Override via NEXT_PUBLIC_* env vars without touching code.
export const DEPOSIT_PAYMENT_DETAILS = {
  accountName:
    process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME || "Success Van Hire Ltd",
  cardNumber:
    process.env.NEXT_PUBLIC_DEPOSIT_CARD_NUMBER || "0000 0000 0000 0000",
  sortCode: process.env.NEXT_PUBLIC_DEPOSIT_SORT_CODE || "",
  accountNumber: process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NUMBER || "",
};
