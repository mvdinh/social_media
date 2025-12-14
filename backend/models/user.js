import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  // 1. ĐỊNH DANH (Quan trọng nhất)
  address: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    index: true 
  },
  
  // Dùng để ký message xác thực (SIWE)
  nonce: { 
    type: String, 
    default: () => Math.floor(Math.random() * 1000000).toString() 
  },
  
  // JWT Refresh Token (Ẩn đi để bảo mật)
  refreshToken: { 
    type: String, 
    default: null, 
    select: false 
  },

  // 2. PROFILE HIỂN THỊ
  username: { 
    type: String, 
    // SỬA Ở ĐÂY: Dùng function thường để lấy giá trị từ this.address
    default: function() {
        return this.address; // Lấy toàn bộ address làm username mặc định
    },
    index: 'text' 
  },
  
  avatar: { 
    type: String, 
    default: "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
  },
  
  bio: { 
    type: String, 
    default: "" 
  },
  
  coverImage: { 
    type: String, 
    default: "" 
  },

  // Link IPFS (Tuỳ chọn: nếu muốn lưu source gốc phi tập trung)
  profileIpfsHash: { type: String, default: null },

  // 3. SOCIAL STATS (Followers/Following)
  followers: [{ type: String, lowercase: true }], // Danh sách address người theo dõi
  following: [{ type: String, lowercase: true }], // Danh sách address đang theo dõi

  createdAt: { type: Date, default: Date.now }
});


const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;