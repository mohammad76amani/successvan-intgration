import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    purpose: { type: String },
    expert: { type: String },
    image: { type: String },
    video: { type: String },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "Type", required: true },
    showPrice: { type: Number, required: true, min: 0 },
    selloffer: { type: Number, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    properties: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    rules: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    requiredLicense: { type: String, required: true },
    servicesPeriod: {
      tyre: { type: Number, min: 1 },
      oil: { type: Number, min: 1 },
      coolant: { type: Number, min: 1 },
      breakes: { type: Number, min: 1 },
      service: { type: Number, min: 1 },
      adBlue: { type: Number, min: 1 },
    },
    pricingTiers: [
      {
        minDays: { type: Number, required: true, min: 1 },
        maxDays: { type: Number, required: true },
        pricePerDay: { type: Number, required: true, min: 0 },
      },
    ],
    extrahoursRate: { type: Number, required: true, min: 0 },
    // Deposit rules for this category. The customer picks one of three ways
    // to cover the deposit:
    //  - full:   pay the full (refundable) deposit up front by bank transfer
    //            and get fullPayDiscountPercent off the rental price
    //  - secure: pay the smaller non-refundable securePayPrice
    //  - office: pay the deposit at the office (officePayPrice fee, if any)
    deposit: {
      amount: { type: Number, min: 0, default: 0 },
      fullPayDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
      securePayPrice: { type: Number, min: 0, default: 0 },
      officePayPrice: { type: Number, min: 0, default: 0 },
    },
    fuel: {
      type: String,
      enum: ["gas", "diesel", "electric", "hybrid"],
      required: true,
    },
    gear: {
      availableTypes: [
        {
          type: String,
          enum: ["automatic", "manual"],
          required: true,
        },
      ],
      automaticExtraCost: { type: Number, min: 0, default: 0 },
    },
    seats: { type: Number, required: true },
    doors: { type: Number, required: true },
  },
  { timestamps: true }
);

// Delete cached model to ensure schema updates are applied
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model("Category", categorySchema);
