import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    ownershipType: {
      type: String,
      enum: ["Owned", "Attached", "Hired"],
      default: "Owned",
    },
    transporter: {
      type: String,
      trim: true,
      default: "",
    },
    ownerName: {
      type: String,
      trim: true,
      default: "",
    },
    vehicleType: {
      type: String,
      trim: true,
      default: "",
    },
    maximumCapacity: {
      type: Number,
      min: 0,
      default: 0,
    },
    fuelType: {
      type: String,
      enum: ["Diesel", "CNG", "Petrol"],
      default: "Diesel",
    },
    fuelRate: {
      type: Number,
      default: 0,
    },
    insuranceExpiry: { type: Date, default: null },
    pucExpiry: { type: Date, default: null },
    fitnessExpiry: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Active", "Maintenance", "Inactive"],
      default: "Active",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "Vehicles" },
);
vehicleSchema.index({ vehicleNo: 1 }, { unique: true });
vehicleSchema.index({ status: 1, transporter: 1 });

export default mongoose.model("Vehicle", vehicleSchema);
