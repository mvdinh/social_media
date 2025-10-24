// ===============================================
// models/Story.js - Story Model
// ===============================================
import mongoose from 'mongoose';
const storySchema = new mongoose.Schema({
  img: {
    type: String,
    required: true,
    maxlength: 255
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ
    },
    index: true
  }
}, {
  timestamps: true
});

// TTL index - tự động xóa story sau 24 giờ
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Story', storySchema);