import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  status: { type: String, enum: ["NONE", "SENT_PENDING", "RECEIVED_PENDING", "ACCEPTED"], default: "NONE" },
  createdAt: { type: Date, default: Date.now },
});

// Index để tránh duplicate sender-receiver
relationshipSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export default mongoose.model("Relationship", relationshipSchema);
