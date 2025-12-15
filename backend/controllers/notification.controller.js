import Notification from "../models/notification.js";
import { IPFS_CONFIG } from "../config/ipfs.js"; // Đảm bảo bạn có config này
// Hoặc import hàm helper getUrl nếu bạn có

// 1. LẤY DANH SÁCH THÔNG BÁO
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy ID từ token đã xác thực

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(20) // Lấy 20 cái gần nhất (có thể làm pagination sau)
      .populate("sender", "username avatar address") // Lấy thông tin người gửi
      .populate("postId", "mediaUrls content") // Lấy sơ qua thông tin bài viết (nếu cần hiển thị ảnh nhỏ)
      .lean();

    // Xử lý Avatar IPFS cho đồng bộ với PostController
    const formattedNotifications = notifications.map((notif) => {
      let senderAvatar = notif.sender?.avatar;

      // Logic check IPFS
      if (senderAvatar && !senderAvatar.startsWith("http")) {
        senderAvatar = `${IPFS_CONFIG.GATEWAY_URL}/${senderAvatar}`;
      } else if (!senderAvatar) {
        senderAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.sender?._id}`;
      }

      return {
        ...notif,
        sender: {
          ...notif.sender,
          avatar: senderAvatar,
        },
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Lỗi lấy thông báo" });
  }
};

// 2. ĐÁNH DẤU 1 THÔNG BÁO LÀ ĐÃ ĐỌC
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Notification.findByIdAndUpdate(id, { isRead: true });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật trạng thái" });
  }
};

// 3. ĐÁNH DẤU TẤT CẢ LÀ ĐÃ ĐỌC
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Lỗi cập nhật tất cả" });
  }
};