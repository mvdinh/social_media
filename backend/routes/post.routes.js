import express from "express";
import { verifyToken } from "../middleware/auth.js"; // Middleware check JWT
import { uploadMiddleware } from "../middleware/upload.js"; // Middleware Multer upload file
import { 
  createPost, 
  toggleLike, 
  getPosts, 
  addComment,
  getComments,
  getPostsByUser
} from "../controllers/post.controller.js";

const router = express.Router();

router.get("/", verifyToken, getPosts); 

// 2. Xem bình luận của một bài viết
router.get("/:postId/comments", verifyToken, getComments); 

// 3. Tạo bài viết (Có thể upload tối đa 4 file media)
// Lưu ý: field name là 'storyFile' phải khớp với Frontend FormData
router.post(
  "/create", 
  verifyToken, 
  uploadMiddleware.array("files", 4), 
  createPost
);

// 4. Like / Unlike
router.post("/:postId/like", verifyToken, toggleLike);

// 5. Bình luận
router.post("/:postId/comment", verifyToken, addComment);

router.get("/:id", verifyToken, getPostsByUser);

export default router;