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
      enum: ["rental_agreement"],
      default: "rental_agreement",
      required: true,
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
contractSchema.index(
  { bookingId: 1, contractType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: ["voided", "expired", "declined"] },
    },
  },
);

export default mongoose.models.Contract ||
  mongoose.model("Contract", contractSchema);
