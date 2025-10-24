// ===============================================
// models/Comment.js - Comment Model
// ===============================================
import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({
  desc: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

export default mongoose.model('Comment', commentSchema);