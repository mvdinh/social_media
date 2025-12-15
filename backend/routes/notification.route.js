import express from "express";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middleware/auth.js"; // Import middleware xác thực của bạn

const router = express.Router();

// Tất cả route này đều cần đăng nhập
router.use(verifyToken);

// GET: /api/notifications
router.get("/", getNotifications);

// PUT: /api/notifications/read-all (Đặt trước :id để tránh conflict)
router.put("/read-all", markAllAsRead);

// PUT: /api/notifications/:id/read
router.put("/:id/read", markAsRead);

export default router;