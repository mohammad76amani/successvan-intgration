import mongoose from "mongoose";
 
const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  percentage: { type: Number, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["active", "inactive", "expired"],
    default: "inactive",
  },
});

// Drop the old unique index on usedBy if it exists
if (mongoose.models.Discount) {
  mongoose.models.Discount.collection.dropIndex('usedBy_1').catch(() => {});
}

export default mongoose.models.Discount ||
  mongoose.model("Discount", discountSchema);
