import mongoose, { Schema, Document } from "mongoose";

export interface ITestimonial extends Document {
  name: string;
  email: string;
  message: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  link?: string;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    link: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Testimonial ||
  mongoose.model<ITestimonial>("Testimonial", testimonialSchema);
