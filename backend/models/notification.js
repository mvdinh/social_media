import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true }, // Address người nhận
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Link tới User để lấy avatar
  type: { type: String, enum: ["LIKE_POST", "COMMENT_POST", "FOLLOW"], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  content: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);