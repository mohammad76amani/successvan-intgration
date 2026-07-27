import mongoose from "mongoose";
import crypto from "crypto";
import {
  RESERVATION_STATUSES,
  DEPOSIT_STATUSES,
  DEPOSIT_OPTIONS,
  REFUND_STATUSES,
} from "@/lib/reservation-status";

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
      enum: RESERVATION_STATUSES,
      default: "pending",
    },
    // Every status change, appended by the API routes. Powers the customer
    // activity timeline.
    statusHistory: [
      {
        status: { type: String, enum: RESERVATION_STATUSES, required: true },
        changedAt: { type: Date, default: Date.now },
        source: {
          type: String,
          enum: ["admin", "customer", "system"],
          default: "system",
        },
        note: { type: String, trim: true },
      },
    ],
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
    // ── Booking journey data ─────────────────────────────────────
    deposit: {
      amount: { type: Number },
      // Which deposit rule the customer chose (see category.deposit).
      option: { type: String, enum: DEPOSIT_OPTIONS },
      status: { type: String, enum: DEPOSIT_STATUSES, default: "not_paid" },
      dueAt: { type: Date },
      paidAt: { type: Date },
      method: { type: String, trim: true },
      transactionRef: { type: String, trim: true },
      // Payment slip uploaded by the customer after the bank transfer.
      receiptUrl: { type: String, trim: true },
      receiptUploadedAt: { type: Date },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      failureReason: { type: String, trim: true },
      // Snapshot of the full-pay discount promised when the option was chosen.
      discountPercent: { type: Number, min: 0, max: 100 },
    },
    collectionCode: { type: String, trim: true },
    // Snapshot of the category handover deposit. Admin can adjust this per
    // reservation for special cases before completing handover.
    handoverDepositAmount: { type: Number, min: 0 },
    handover: {
      startedAt: { type: Date },
      startMileage: { type: Number },
      startFuelLevel: { type: String, trim: true },
      conditionNotes: { type: String, trim: true },
      existingDamages: [{ type: String, trim: true }],
      photos: [{ type: String, trim: true }],
      customerSignature: { type: String },
      staffSignature: { type: String },
      keyCount: { type: Number, min: 0 },
      equipment: [{ type: String, trim: true }],
      customFields: [
        {
          label: { type: String, trim: true },
          fieldType: { type: String, enum: ["input", "file"] },
          inputType: { type: String },
          value: { type: String },
          files: [{ type: String, trim: true }],
          helpText: { type: String, trim: true },
        },
      ],
      completedAt: { type: Date },
    },
    inspection: {
      receivedAt: { type: Date },
      returnMileage: { type: Number },
      returnFuelLevel: { type: String, trim: true },
      newDamages: [{ type: String, trim: true }],
      lateReturn: { type: Boolean, default: false },
      lateMinutes: { type: Number, min: 0, default: 0 },
      cleaningIssue: { type: Boolean, default: false },
      missingEquipment: [{ type: String, trim: true }],
      photos: [{ type: String, trim: true }],
      notes: { type: String, trim: true },
      customFields: [
        {
          label: { type: String, trim: true },
          fieldType: { type: String, enum: ["input", "file"] },
          inputType: { type: String },
          value: { type: String },
          files: [{ type: String, trim: true }],
          helpText: { type: String, trim: true },
        },
      ],
      completedAt: { type: Date },
    },
    refund: {
      depositPaid: { type: Number },
      charges: {
        fuel: { type: Number, default: 0 },
        late: { type: Number, default: 0 },
        damage: { type: Number, default: 0 },
        cleaning: { type: Number, default: 0 },
        missingEquipment: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      chargeReason: { type: String, trim: true },
      otherChargeReason: { type: String, trim: true },
      evidence: [{ type: String, trim: true }],
      deductionsTotal: { type: Number, default: 0 },
      refundAmount: { type: Number },
      status: { type: String, enum: REFUND_STATUSES, default: "not_started" },
      reference: { type: String, trim: true },
      expectedBy: { type: Date },
      approvedAt: { type: Date },
      processedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Generate a unique order code on creation. Retries on the (extremely unlikely)
// event of a collision; the unique index is the final safety net.
// Seed the status history with the initial status on creation.
reservationSchema.pre("save", function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      { status: this.status, changedAt: new Date(), source: "system" },
    ] as typeof this.statusHistory;
  }
  next();
});

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
