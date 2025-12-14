// models/groupJoinRequest.model.js
import mongoose from "mongoose";

const GroupJoinRequestSchema = new mongoose.Schema({
  groupId: { type: Number, required: true, index: true },
  userAddress: { type: String, required: true, lowercase: true },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },
  createdAt: { type: Date, default: Date.now }
});

GroupJoinRequestSchema.index(
  { groupId: 1, userAddress: 1 },
  { unique: true }
);

export default mongoose.model("GroupJoinRequest", GroupJoinRequestSchema);
