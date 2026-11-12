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
    // Optional so historical records that only have vehicleNo remain valid.
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
      index: true,
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
      enum: ["Diesel", "CNG"],
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

transportSchema.index({ vehicleNo: 1, date: -1 });
// A freight memo identifies one transport record.  This database constraint is
// the last line of defence when two imports run at the same time.
transportSchema.index({ freightMemoNo: 1 }, { unique: true });

export default mongoose.model("Transport", transportSchema);
