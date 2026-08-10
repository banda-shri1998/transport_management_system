import mongoose from "mongoose";

const partySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  contact: String,
  address: String
});

export default mongoose.model("Party", partySchema);
