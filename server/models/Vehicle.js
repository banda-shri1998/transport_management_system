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
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, collection: "Vehicles" },
);

export default mongoose.model("Vehicle", vehicleSchema);
