import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  // Người nhận thông báo (Chủ bài viết)
  recipient: { 
    type: String, 
    required: true, 
    lowercase: true, // Quan trọng: Address ví luôn viết thường
    index: true      // Quan trọng: Giúp query "Lấy thông báo của tôi" nhanh hơn
  },

  // Người tạo ra hành động (Người like, comment)
  sender: { 
    type: String, 
    required: true, 
    lowercase: true 
  },
  
  // Loại thông báo để Frontend hiện icon tương ứng (Tim, Comment, Follow...)
  type: { 
    type: String, 
    enum: ['LIKE_POST', 'COMMENT_POST', 'FOLLOW', 'SYSTEM'], 
    required: true 
  },
  
  // Link đến bài viết (nếu có)
  // Dùng ObjectId để liên kết với Collection Post
  postId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    default: null 
  },

  // Nội dung text ngắn gọn (VD: "đã thích bài viết của bạn")
  message: { 
    type: String, 
    default: "" 
  },

  // Trạng thái đã đọc hay chưa
  isRead: { 
    type: Boolean, 
    default: false 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Notification", NotificationSchema);