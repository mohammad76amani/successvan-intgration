import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "reservation_reminder",
        "reservation_confirmed",
        "reservation_canceled",
        "reservation_delivered",
        "reservation_completed",
        "refund_due_owner",
      ],
      required: true,
    },
    dedupeKey: { type: String, trim: true },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phoneNumber: { type: String, required: true },
    message: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0, min: 0 },
    claimedAt: { type: Date },
    sentAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
