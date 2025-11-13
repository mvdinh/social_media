import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema({
  user1: { type: String, required: true }, // dùng string thay vì ObjectId
  user2: { type: String, required: true }, // dùng string thay vì ObjectId
  status: { type: String, enum: ["NONE", "PENDING", "ACCEPTED"], default: "NONE" },
}, { timestamps: true });

// tạo index để tránh duplicate
relationshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

export default mongoose.model("Relationship", relationshipSchema);
