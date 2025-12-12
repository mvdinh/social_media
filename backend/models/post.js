import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  contentHash: {
    type: String,
    required: true
  },
  mediaHashes: [{
    type: String
  }],
  mediaType: {
    type: Number,
    enum: [0, 1, 2, 3], // TEXT, IMAGE, VIDEO, MIXED
    default: 0
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  isNFT: {
    type: Boolean,
    default: false
  },
  nftTokenId: {
    type: Number,
    default: 0
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

postSchema.index({ blockchainId: 1 });
postSchema.index({ author: 1, timestamp: -1 });
postSchema.index({ timestamp: -1 });

export default mongoose.model('Post', postSchema);