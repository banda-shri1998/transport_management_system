import {
  Int32
 } from "mongodb";
import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    fmNo: {
      type: Int32,
      required: true,
      unique: true,
    },

    fmDate: {
      type: Date,
      required: true,
    },

    consignor: String,
    consignee: String,

    from: String,
    to: String,

    vehicleNo: String,
    driverName: String,

    lrNo: Int16Array,
    challanNo: String,

    material: String,

    bags: Number,
    weight: Number,

    fuelType: String,
    fuelRate: Number,
    fuelAmount: Number,

    freightAmount: Number,
    advanceAmount: Number,

    balanceAmount: Number,

    paymentStatus: {
      type: String,
      default: "Pending",
    },

    paymentAmount: Number,

    paymentConfirmationDate: Date,

    remarks: String,
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Trip", tripSchema);