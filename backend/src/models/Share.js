// ===============================================
// models/Share.js - Share Cache (từ blockchain)
// ===============================================
import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
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

shareSchema.index({ postId: 1, timestamp: -1 });

export default mongoose.model('Share', shareSchema);