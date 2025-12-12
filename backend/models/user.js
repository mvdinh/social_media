import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true },
  nonce: { type: String, default: () => Math.floor(Math.random() * 1000000).toString() },
  
  // Thêm trường này để quản lý Refresh Token
  refreshToken: { type: String, default: null },

  username: { type: String },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);