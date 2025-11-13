import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema({
  user1: { type: String, required: true },
  user2: { type: String, required: true },
  status: { type: String, enum: ["ACCEPTED"], default: "ACCEPTED" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Friendship", friendshipSchema);
