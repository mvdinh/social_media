import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  address: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true 
  },

  nonce: { 
    type: String, 
    default: () => Math.floor(Math.random() * 1000000).toString() 
  },

  refreshToken: { 
    type: String, 
    default: null, 
    select: false 
  },

  // =====================
  // PROFILE
  // =====================
  username: { 
    type: String,
    default: function () {
      return this.address;
    },
    index: "text"
  },

  // Avatar hiển thị
  avatar: {
    type: String,
    default: function () {
      if (!this.address) return "";

      const letter = this.address.slice(-1).toUpperCase();
      return `https://ui-avatars.com/api/?name=${letter}&background=0D8ABC&color=ffffff&size=256&bold=true`;
    }
  },

  // IPFS hash chỉ có khi user upload avatar/profile
  avatarIpfsHash: { 
    type: String, 
    default: null 
  },

  bio: { type: String, default: "" },
  coverImage: { type: String, default: "" },

  followers: [{ type: String, lowercase: true }],
  following: [{ type: String, lowercase: true }],

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
