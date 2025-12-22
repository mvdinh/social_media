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

  username: { 
    type: String,
    default: function () { return this.address; },
    index: "text"
  },

  avatar: {
    type: String,
    default: function () {
      if (!this.address) return "";
      const letter = this.address.slice(-1).toUpperCase();
      return `https://ui-avatars.com/api/?name=${letter}&background=0D8ABC&color=ffffff&size=256&bold=true`;
    }
  },

  avatarIpfsHash: { type: String, default: null },

  coverImage: { type: String, default: "" },

  coverImageIpfsHash: { type: String, default: null }, 

  bio: { type: String, default: "" },
  
  dob: { type: Date, default: null }, 
  
  hometown: { type: String, default: "" }, 
  
  relationshipStatus: { 
    type: String, 
    enum: ["Độc thân", "Đang hẹn hò", "Đã kết hôn", "Đã ly hôn", "Phức tạp", ""], // Giới hạn các giá trị
    default: "" 
  },

  followers: [{ type: String, lowercase: true }],

  following: [{ type: String, lowercase: true }],

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;