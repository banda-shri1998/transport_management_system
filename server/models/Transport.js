import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },

    transportName: {
      type: String,
      required: true,
      trim: true,
    },

    freightMemoNo: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "freightMemoNo must be an integer",
      },
    },

    lrNo: [
      {
        type: String,
        trim: true,
      },
    ],

    vehicleNo: {
      type: String,
      required: true,
    },

    partyName: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    advancePaid: {
      type: Number,
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

    fuelQuantity: {
      type: Number,
      default: 0,
    },

    fuelExpense: {
      type: Number,
      default: 0,
    },

    paymentDate: {
      type: Date,
    },

    payAmount: {
      type: Number,
      default: 0,
    },

    balance: {
      type: Number,
      required: true,
    },

    previousClosingBalance: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "Partial"],
      default: "Unpaid",
    },

    paymentAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Transport", transportSchema);
