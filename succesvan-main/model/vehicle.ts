import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    available: {
      type: Boolean,
      default: true, // ← This ensures new vehicles are available
    },
    gear: {
      availableTypes: [
        {
          gearType: { type: String, enum: ["automatic", "manual"], required: true },
        },
      ],
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
     brand:{type:String},
    make: { type: String, required: true, trim: true },
     keyNumber:{type:String},
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
    number: { type: String, required: true },
    color: { type: String, trim: true },

    office: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
      required: true,
    },
    properties: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    serviceHistory: {
      tyre: { type: Date, default: Date.now },
      oil: { type: Date, default: Date.now },
      coolant: { type: Date, default: Date.now },
      breakes: { type: Date, default: Date.now },
      service: { type: Date, default: Date.now },
      adBlue: { type: Date, default: Date.now },
    },
    needsService: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Vehicle ||
  mongoose.model("Vehicle", vehicleSchema);
