import mongoose from "mongoose";
import { CONTRACT_STATUSES } from "@/lib/docusign/types";

const documentMetadataSchema = new mongoose.Schema(
  {
    storageKey: { type: String, select: false },
    fileName: { type: String },
    mimeType: { type: String },
    sha256: { type: String },
    downloadedAt: { type: Date },
  },
  { _id: false },
);

const auditTrailSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    source: {
      type: String,
      enum: ["admin", "customer", "docusign", "system"],
      required: true,
    },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const contractSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    contractNumber: { type: String, required: true, unique: true },
    contractType: {
      type: String,
      enum: ["rental_agreement", "reservation_extension"],
      default: "rental_agreement",
      required: true,
    },
    originalContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
    },
    extensionBookingKey: { type: String, select: false },
    extension: {
      previousReturnDateTime: { type: Date },
      newReturnDateTime: { type: Date },
      durationHours: { type: Number, min: 0 },
      durationLabel: { type: String, trim: true },
      calculatedPrice: { type: Number, min: 0 },
      agreedPrice: { type: Number, min: 0 },
      customPriceApplied: { type: Boolean, default: false },
      customPriceReason: { type: String, trim: true },
      priceBreakdown: [
        {
          label: { type: String, trim: true },
          amount: { type: Number, min: 0 },
        },
      ],
      paymentDueAt: { type: Date },
      paymentMethod: { type: String, trim: true },
      paymentReference: { type: String, trim: true },
      lessorName: { type: String, trim: true },
      appliedAt: { type: Date },
    },
    status: {
      type: String,
      enum: CONTRACT_STATUSES,
      default: "draft",
      required: true,
    },
    docusign: {
      envelopeId: { type: String },
      accountId: { type: String },
      signerRecipientId: { type: String, default: "1", required: true },
      signerClientUserId: { type: String, required: true },
      envelopeStatus: { type: String },
      statusChangedAt: { type: Date },
      sentAt: { type: Date },
      deliveredAt: { type: Date },
      viewedAt: { type: Date },
      completedAt: { type: Date },
      declinedAt: { type: Date },
      voidedAt: { type: Date },
      declineReason: { type: String },
      voidReason: { type: String },
    },
    sourceDocument: { type: documentMetadataSchema, default: {} },
    signedDocument: { type: documentMetadataSchema, default: {} },
    certificateDocument: { type: documentMetadataSchema, default: {} },
    lastWebhookEvent: {
      eventId: { type: String },
      eventType: { type: String },
      receivedAt: { type: Date },
      processedAt: { type: Date },
    },
    auditTrail: { type: [auditTrailSchema], default: [] },
    error: {
      code: { type: String },
      message: { type: String },
      occurredAt: { type: Date },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

contractSchema.index({ bookingId: 1 });
contractSchema.index({ customerId: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ createdAt: -1 });
contractSchema.index(
  { "docusign.envelopeId": 1 },
  {
    unique: true,
    partialFilterExpression: { "docusign.envelopeId": { $type: "string" } },
  },
);
contractSchema.index({ bookingId: 1, contractType: 1, createdAt: -1 });
contractSchema.index({ originalContractId: 1 });
contractSchema.index(
  { extensionBookingKey: 1 },
  {
    unique: true,
    name: "one_extension_per_booking",
    partialFilterExpression: { extensionBookingKey: { $type: "string" } },
  },
);

const existingContractModel = mongoose.models.Contract;

// Next.js development reloads modules without clearing Mongoose's model cache.
// Keep an already-compiled Contract model in sync when enum values are added,
// otherwise the cached schema rejects reservation extension contracts until the
// whole dev server is restarted.
if (existingContractModel) {
  if (!existingContractModel.schema.path("extensionBookingKey")) {
    existingContractModel.schema.add({
      extensionBookingKey: { type: String, select: false },
    });
  }
  const contractTypePath = existingContractModel.schema.path(
    "contractType",
  ) as
    | (mongoose.SchemaType & {
        enumValues: string[];
        enum: (...values: string[]) => unknown;
      })
    | undefined;

  if (
    contractTypePath &&
    !contractTypePath.enumValues.includes("reservation_extension")
  ) {
    contractTypePath.enum("reservation_extension");
  }
}

export default existingContractModel || mongoose.model("Contract", contractSchema);
