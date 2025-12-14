import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  getPendingRequests, 
  getSuggestedUsers, 
  sendFriendRequest, 
  acceptFriendRequest, 
  removeRelationship, 
  getFriends 
} from "../controllers/relationshipController.js";

const router = express.Router();

router.use(verifyToken);

// GET
router.get("/list", getFriends);              // Lấy danh sách bạn bè
router.get("/pending", getPendingRequests);   // Lấy lời mời kết bạn
router.get("/suggestions", getSuggestedUsers);// Lấy gợi ý

// POST
router.post("/request", sendFriendRequest);   // Gửi lời mời
router.post("/accept", acceptFriendRequest);  // Chấp nhận
router.post("/reject", removeRelationship);   // Từ chối (Xóa)
router.post("/unfriend", removeRelationship); // Hủy kết bạn (Xóa)

export default router;