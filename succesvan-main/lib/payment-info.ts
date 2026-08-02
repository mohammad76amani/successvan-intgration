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
  accountName:
    process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME || "Success Van Hire Ltd",
  cardNumber: configuredCardNumber || developmentCardNumber,
  sortCode: process.env.NEXT_PUBLIC_DEPOSIT_SORT_CODE || "",
  accountNumber: process.env.NEXT_PUBLIC_DEPOSIT_ACCOUNT_NUMBER || "",
  isTestCard: Boolean(developmentCardNumber),
};
