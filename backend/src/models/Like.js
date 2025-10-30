// ===============================================
// models/Like.js - Like Cache (từ blockchain)
// ===============================================
import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  postId: {
    type: Number,
    required: true,
    index: true
  },
  user: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  txHash: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

likeSchema.index({ postId: 1, user: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);