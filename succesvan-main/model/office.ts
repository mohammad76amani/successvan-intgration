import mongoose from "mongoose";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const specialDayTimeWindowSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: timePattern,
    },
    endTime: {
      type: String,
      required: true,
      match: timePattern,
    },
  },
  { _id: false }
);

const workingDayTimeWindowSchema = new mongoose.Schema(
  {
    isOpen: { type: Boolean, required: true, default: true },
    startTime: {
      type: String,
      required: function () {
        return this.isOpen;
      },
      match: timePattern,
    },
    endTime: {
      type: String,
      required: function () {
        return this.isOpen;
      },
      match: timePattern,
    },
  },
  { _id: false }
);

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    address: { type: String, required: true },
    phone: { type: String, required: true },
    workingTime: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
          required: true,
        },
        isOpen: { type: Boolean, required: true, default: true },
        startTime: {
          type: String,
          match: timePattern,
        },
        endTime: {
          type: String,
          match: timePattern,
        },
        pickupTime: {
          type: workingDayTimeWindowSchema,
          default: undefined,
        },
        returnTime: {
          type: workingDayTimeWindowSchema,
          default: undefined,
        },
        pickupExtension: {
          startTime: {
            type: String,
            match: timePattern,
          },
          endTime: {
            type: String,
            match: timePattern,
          },
          hoursBefore: { type: Number, default: 0, min: 0 },
          hoursAfter: { type: Number, default: 0, min: 0 },
          flatPrice: { type: Number, default: 0, min: 0 },
        },
        returnExtension: {
          startTime: {
            type: String,
            match: timePattern,
          },
          endTime: {
            type: String,
            match: timePattern,
          },
          hoursBefore: { type: Number, default: 0, min: 0 },
          hoursAfter: { type: Number, default: 0, min: 0 },
          flatPrice: { type: Number, default: 0, min: 0 },
        },
      },
    ],
    specialDays: [
      {
        month: { type: Number, required: true, min: 1, max: 12 },
        day: { type: Number, required: true, min: 1, max: 31 },
        isOpen: { type: Boolean, required: true, default: false },
        startTime: {
          type: String,
          match: timePattern,
        },
        endTime: {
          type: String,
          match: timePattern,
        },
        pickupTime: {
          type: specialDayTimeWindowSchema,
          required: function () {
            return this.isOpen;
          },
          default: undefined,
        },
        returnTime: {
          type: specialDayTimeWindowSchema,
          required: function () {
            return this.isOpen;
          },
          default: undefined,
        },
        pickupExtension: {
          type: specialDayTimeWindowSchema,
          default: undefined,
        },
        returnExtension: {
          type: specialDayTimeWindowSchema,
          default: undefined,
        },
        reason: { type: String },
        extraPrice: { type: Number, default: 0, min: 0 },
      },
    ],
    vehicles: [
      {
        vehicle: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vehicle",
          required: true,
        },
        inventory: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

const Office = mongoose.models.Office || mongoose.model("Office", officeSchema);

export default Office;
