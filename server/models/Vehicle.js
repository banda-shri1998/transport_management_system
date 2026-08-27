import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
  { timestamps: true },
);

export default mongoose.model("Vehicle", vehicleSchema);
