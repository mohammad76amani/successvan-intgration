import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.models.Verification || mongoose.model("Verification", verificationSchema);
