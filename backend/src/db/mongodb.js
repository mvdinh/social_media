import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  author: { type: String, required: true },
  contentCID: { type: String, required: true },
  timestamp: { type: Number, required: true },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  shareCount: { type: Number, default: 0 },
  content: { type: Object }, // Cached IPFS content
  likes: [{ address: String, timestamp: Number }],
  comments: [{
    address: String,
    commentCID: String,
    content: Object,
    timestamp: Number
  }],
  shares: [{
    address: String,
    newPostId: Number,
    timestamp: Number
  }]
}, { timestamps: true });

postSchema.index({ postId: 1 });
postSchema.index({ author: 1 });
postSchema.index({ timestamp: -1 });

export const Post = mongoose.model('Post', postSchema);