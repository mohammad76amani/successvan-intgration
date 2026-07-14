import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    emaildata: {
      emailAddress: { type: String, required: true, unique: true },
      isVerified: { type: Boolean, default: false },
    },
    phoneData: {
      phoneNumber: { type: String, required: true, unique: true },
      isVerified: { type: Boolean, default: false },
    },
    role: { type: String, enum: ["user", "admin", "owner", "Secretary", "Consultant", "Accountant"], default: "user" },
    licenceAttached: {
      front: { type: String },
      back: { type: String },
    },
    avatar: { type: String },
    address: { type: String },
    postalCode: { type: String },
    city: { type: String },

  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
