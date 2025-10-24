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
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 45,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: 45,
    validate: {
      validator: v => !v || /^\S+@\S+\.\S+$/.test(v),
      message: 'Invalid email format'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 45
  },
  coverPic: { type: String, default: '', maxlength: 255 },
  profilePic: { type: String, default: '', maxlength: 255 },
  city: { type: String, default: '', maxlength: 45 },
  nonce: { type: String, default: null },
  nonceExpiry: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ address: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Methods
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
  this.loginCount += 1;
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.nonce;
  delete obj.nonceExpiry;
  delete obj.__v;
  return obj;
};

export default mongoose.model('User', userSchema);
