// ===============================================
// models/Comment.js - Comment Cache (từ blockchain)
// ===============================================
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  postId: {
    type: Number,
    required: true,
    index: true
  },
  author: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  commentIndex: {  // ✅ THÊM - để query xóa nhanh
    type: Number,
  },
  contentHash: {
    type: String,
    required: true
  },
  mediaHash: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  txHash: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number
  }
}, {
  timestamps: true
});

commentSchema.index({ postId: 1, commentIndex: 1 }, { unique: true });
commentSchema.index({ postId: 1, timestamp: -1 });
commentSchema.index({ author: 1 });

export default mongoose.model('Comment', commentSchema);