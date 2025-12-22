import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },

  content: { 
    type: String, 
    default: "" 
  },

  // URLs ảnh/video (Lưu đường dẫn file trên server hoặc cloud)
  mediaUrls: [{ 
    type: String 
  }],

  mediaType: { 
    type: String, 
    enum: ['TEXT', 'IMAGE', 'VIDEO', 'MIXED'], 
    default: 'TEXT' 
  },

  // Mảng chứa Address của người like (để check xem user hiện tại like chưa)
  likes: [{ 
    type: String, 
    lowercase: true
  }],

  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },

  isDeleted: { type: Boolean, default: false },

  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Group", 
    default: null // Mặc định là null (bài viết cá nhân)
  },

  createdAt: { type: Date, default: Date.now }
});

PostSchema.index({ group: 1, createdAt: -1 });
export default mongoose.model("Post", PostSchema);