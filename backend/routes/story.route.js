import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js"; // Middleware xác thực
import { uploadMiddleware } from "../middleware/upload.js"; // Middleware upload file
import { 
  getStories, 
  createStory, 
  viewStoryProxy 
} from "../controllers/storyController.js";
import { 
  createReaction, 
  getReactions 
} from "../controllers/reactionController.js";

const router = express.Router();

// ==========================================
// 📖 STORY ROUTES
// ==========================================

// 1. Xem danh sách Story (Public - Ai cũng xem được)
router.get("/", getStories);

// 2. Tạo Story (Private - Cần Token)
// Thứ tự: Check Token -> Xử lý File Upload -> Logic Controller
router.post(
  "/create", 
  verifyToken, 
  uploadMiddleware.single("storyFile"), 
  createStory
);

// 3. Xem ảnh/video (Proxy qua server để tránh lỗi CORS)
router.get("/view/:cid", viewStoryProxy);


// ==========================================
// ❤️ REACTION ROUTES
// ==========================================


router.post("/react", verifyToken, createReaction);

// 5. Lấy số lượng tim (Public)
router.get("/reactions/:storyHash", getReactions);

export default router;