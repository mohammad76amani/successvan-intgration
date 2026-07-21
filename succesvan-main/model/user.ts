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
    role: { type: String, enum: ["user", "admin","owner","Secretary","Consultant","Accountant"], default: "user" },
    licenceAttached: {
      front: { type: String },
      back: { type: String },
    },
    licenceDetails: {
      firstName: { type: String },
      lastName: { type: String },
      fullName: { type: String },
      dateOfBirth: { type: String },
      address: { type: String },
      postcode: { type: String },
      licenseNumber: { type: String },
      licenceNumber: { type: String },
      issueDate: { type: String },
      expirationDate: { type: String },
      expiryDate: { type: String },
      issuingCountry: { type: String },
      issuingAuthority: { type: String },
      licenceCategories: [{ type: String }],
      extractedAt: { type: Date },
    },
    avatar: { type: String },
    address: { type: String },
    postalCode: { type: String },
    city: { type: String },
    // Structured address captured via the Ideal Postcodes (PAF) lookup flow.
    addressData: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      townCity: { type: String },
      county: { type: String },
      postcode: { type: String },
      country: { type: String, default: "United Kingdom" },
      latitude: { type: Number },
      longitude: { type: Number },
      udprn: { type: Number },
      addressSource: { type: String, enum: ["ideal_postcodes", "manual"] },
      postcodeValidated: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
