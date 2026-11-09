import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    transport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      required: true,
      index: true,
    },
    paymentDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Cheque", "UPI", "Other"],
      default: "Other",
    },
    reference: { type: String, trim: true, default: "" },
    previousBalance: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    transportName: { type: String, trim: true, default: "" },
    freightMemoNo: { type: Number },
    recordedBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
