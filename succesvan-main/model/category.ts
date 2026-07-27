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
    //  - full:   pay the reservation total up front by bank transfer
    //            and get fullPayDiscountPercent off the rental price
    //  - secure: pay the smaller non-refundable securePayPrice
    //  - office: pay the deposit at the office (officePayPrice fee, if any)
    deposit: {
      fullPayDiscountPercent: { type: Number, min: 0, max: 100, default: 0 },
      securePayPrice: { type: Number, min: 0, default: 0 },
      officePayPrice: { type: Number, min: 0, default: 0 },
      handoverDepositPrice: { type: Number, min: 0, default: 0 },
    },
    // Category-specific handover checklist template. Admins can define fields
    // needed before collection, after return, or both. The reservation handover
    // UI can render these fields dynamically per category.
    handoverFormFields: [
      {
        label: { type: String, trim: true, required: true },
        fieldType: {
          type: String,
          enum: ["input", "file"],
          default: "input",
        },
        inputType: {
          type: String,
          enum: ["text", "number", "date", "textarea"],
          default: "text",
        },
        requiredBefore: { type: Boolean, default: false },
        requiredAfter: { type: Boolean, default: false },
        helpText: { type: String, trim: true },
      },
    ],
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
