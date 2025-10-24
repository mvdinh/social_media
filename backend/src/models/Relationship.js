// ===============================================
// models/Relationship.js - Relationship Model
// ===============================================
import mongoose from 'mongoose';

const relationshipSchema = new mongoose.Schema({
  followerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  followedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index để đảm bảo không follow trùng
relationshipSchema.index({ followerUserId: 1, followedUserId: 1 }, { unique: true });
relationshipSchema.index({ followedUserId: 1 });

export default mongoose.model('Relationship', relationshipSchema);