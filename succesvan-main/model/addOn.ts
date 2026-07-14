import mongoose from "mongoose";

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String },
    icon: { type: String },
    pricingType: { type: String, enum: ["flat", "tiered"], required: true },
    flatPrice: {
      amount: {
        type: Number,
        min: 0,
      },
      isPerDay: { type: Boolean, default: false },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    tieredPrice: {
      isPerDay: { type: Boolean, default: false },
      tiers: [
        {
          minDays: { type: Number, required: true, min: 1 },
          maxDays: { type: Number, required: true, min: 1 },
          price: { type: Number, required: true, min: 0 },
        },
      ],
    },
  },
  { timestamps: true }
);

// Optional: Add a unique index on name to prevent duplicates

export default mongoose.models.AddOn || mongoose.model("AddOn", addOnSchema);
