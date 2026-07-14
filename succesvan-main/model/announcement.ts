import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: "",
    },
    textColor: {
      type: String,
      default: "#ffffff",
    },
    backgroundColor: {
      type: String,
      default: "#fe9a00",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to ensure only one announcement is active at a time
announcementSchema.pre("save", async function (next) {
  if (this.isActive) {
    // Deactivate all other announcements
    await mongoose.models.Announcement.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { $set: { isActive: false } }
    );
  }
  next();
});

export default mongoose.models.Announcement ||
  mongoose.model("Announcement", announcementSchema);
