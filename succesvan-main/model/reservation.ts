import mongoose from "mongoose";
import crypto from "crypto";

// Excludes ambiguous characters (0/O, 1/I/L) for readability.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const randomSegment = (length: number) => {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
};

// A unique, UUID-like order code, e.g. "SV-7K9F-2QX4".
const generateReservationCode = () =>
  `SV-${randomSegment(4)}-${randomSegment(4)}`;

const reservationSchema = new mongoose.Schema(
  {
    // Unique, human-friendly order id (UUID-like string, e.g. "SV-7K9F-2QX4").
    // Sparse so reservations created before this field don't collide on the
    // unique index.
    reservationCode: { type: String, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startDateDisplay: { type: String }, // Date as YYYY-MM-DD (what user sees)
    endDateDisplay: { type: String }, // Date as YYYY-MM-DD (what user sees)
    pickupTime: { type: String }, // Time as HH:MM (what user selected)
    returnTime: { type: String }, // Time as HH:MM (what user selected)
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "canceled", "delivered", "completed"],
      default: "pending",
    },
    cancelReason: { type: String, trim: true },
    driverAge: { type: Number, required: true },
    selectedGear: { type: String, enum: ["manual", "automatic"] },
    messege: { type: String },
    pickupExtensionPrice: { type: Number, default: 0 },
    returnExtensionPrice: { type: Number, default: 0 },
    addOns: [
      {
        addOn: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AddOn",
        },
        quantity: { type: Number, required: true, min: 1 },
        selectedTierIndex: { type: Number },
      },
    ],
    discountCode: { type: String },
    isManualPrice: { type: Boolean, default: false },
    manualPricePerDay: { type: Number },
    manualPriceNote: { type: String },
    // Per-invoice: admin creates the reservation with no price; the final
    // total is entered when the admin marks the reservation as completed.
    perInvoice: { type: Boolean, default: false },
    reservationType: { type: String, enum: ["Office", "Website"] },
  },
  { timestamps: true }
);

// Generate a unique order code on creation. Retries on the (extremely unlikely)
// event of a collision; the unique index is the final safety net.
reservationSchema.pre("save", async function (next) {
  if (this.reservationCode) return next();
  try {
    const Model = this.constructor as mongoose.Model<unknown>;
    let code = generateReservationCode();
    let attempts = 0;
    while (await Model.exists({ reservationCode: code })) {
      code = generateReservationCode();
      if (++attempts > 5) break;
    }
    this.reservationCode = code;
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.models.Reservation ||
  mongoose.model("Reservation", reservationSchema);
