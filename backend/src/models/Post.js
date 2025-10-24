// models/Post.js - Post Model
// ===============================================
import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
  desc: {
    type: String,
    maxlength: 200,
    trim: true
  },
  img: {
    type: String,
    maxlength: 255
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// Methods
postSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    this.likeCount += 1;
  }
};

postSchema.methods.removeLike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
    this.likeCount -= 1;
  }
};

postSchema.methods.incrementCommentCount = function() {
  this.commentCount += 1;
};

postSchema.methods.decrementCommentCount = function() {
  if (this.commentCount > 0) {
    this.commentCount -= 1;
  }
};

export default mongoose.model('Post', postSchema);