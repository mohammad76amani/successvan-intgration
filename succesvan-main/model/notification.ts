import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["reservation_reminder", "reservation_confirmed", "reservation_canceled", "reservation_delivered", "reservation_completed"],
      required: true,
    },
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
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    sentAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

notificationSchema.index({ scheduledFor: 1, status: 1 });

export default mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
