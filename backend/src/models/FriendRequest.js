import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  status: { type: String, enum: ["NONE"], default: "NONE" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("FriendRequest", friendRequestSchema);
