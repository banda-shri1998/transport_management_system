import mongoose from "mongoose";

const cancelledSchema = new mongoose.Schema(
  {
    freightMemoNo: {
      type: [Number],
      default: [],
    },
    lrNo: {
      type: [String],
      default: [],
    },
  },
  { collection: "cancelled" },
);

export default mongoose.model("Cancelled", cancelledSchema);
