import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

export default mongoose.model("Vehicle", vehicleSchema);
