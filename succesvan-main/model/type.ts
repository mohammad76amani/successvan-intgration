import mongoose from "mongoose";

const typeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    offices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Office",
    }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Type || mongoose.model("Type", typeSchema);
