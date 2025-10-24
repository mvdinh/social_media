// ===============================================
// models/RefreshToken.js - Refresh Token Model
// ===============================================
import mongoose from 'mongoose';
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  address: {
    type: String,
    required: true,
    lowercase: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  deviceInfo: {
    userAgent: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// TTL index - tự động xóa token hết hạn
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

// Methods
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && new Date() < this.expiresAt;
};

refreshTokenSchema.methods.revoke = function() {
  this.isRevoked = true;
};

export default mongoose.model('RefreshToken', refreshTokenSchema);
