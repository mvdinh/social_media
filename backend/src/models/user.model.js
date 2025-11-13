// ===============================================
// models/User.js - User Model (Authentication only)
// ===============================================
import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    validate: {
      validator: v => /^0x[a-fA-F0-9]{40}$/.test(v),
      message: 'Invalid Ethereum address format'
    }
  },
  nonce: { 
    type: String, 
    default: null,
    index: true
  },
  nonceExpiry: { 
    type: Date, 
    default: null 
  },
  lastLogin: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

userSchema.index({ address: 1 });

userSchema.methods.generateNonce = function() {
  this.nonce = crypto.randomBytes(32).toString('hex');
  this.nonceExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
  return this.nonce;
};

userSchema.methods.verifyNonce = function() {
  return !!(this.nonce && this.nonceExpiry && new Date() < this.nonceExpiry);
};

userSchema.methods.clearNonce = function() {
  this.nonce = null;
  this.nonceExpiry = null;
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.nonce;
  delete obj.nonceExpiry;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);