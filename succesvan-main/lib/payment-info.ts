// Company payment details shown to customers for deposit bank transfers.
// Override via NEXT_PUBLIC_* env vars without touching code. Local development
// gets an unmistakable fake card number so the full receipt journey is testable.
const configuredCardNumber =
  process.env.NEXT_PUBLIC_DEPOSIT_CARD_NUMBER?.trim() || "";
const developmentCardNumber =
  process.env.NODE_ENV !== "production" && !configuredCardNumber
    ? "4242 4242 4242 4242"
    : "";

export const DEPOSIT_PAYMENT_DETAILS = {
  bankName:
    process.env.NEXT_PUBLIC_DEPOSIT_BANK_NAME || "Lloyds Business Bank",
  accountName:
    process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME || "Diba Cooperation Ltd",
  cardNumber: configuredCardNumber || developmentCardNumber,
  sortCode: process.env.NEXT_PUBLIC_DEPOSIT_SORT_CODE || "30-99-09",
  accountNumber: process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NUMBER || "44761060",
  isTestCard: Boolean(developmentCardNumber),
};
