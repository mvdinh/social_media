import mongoose from "mongoose";

const StorySchema = new mongoose.Schema({
  owner: { type: String, required: true, lowercase: true, index: true }, // Địa chỉ ví
  type: { type: String, enum: ['Text', 'Photo', 'Video'], required: true },
  content: { type: String }, // Nội dung text
  backgroundColor: { type: String }, // Màu nền text
  ipfsHash: { type: String, required: true }, // Hash của file hoặc JSON metadata trên IPFS
  mediaUrl: { type: String }, // URL gateway để frontend hiển thị nhanh
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Tự động xóa sau 24h (TTL Index)
});

export default mongoose.model("Story", StorySchema);