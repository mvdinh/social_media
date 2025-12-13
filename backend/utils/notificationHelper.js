import Notification from "../models/notification.js";
import User from "../models/user.js"; // Import User để lấy thông tin avatar/tên người gửi

/**
 * Helper gửi thông báo Realtime + Lưu DB
 * @param {Object} req - Express request object (chứa io và userSocketMap)
 * @param {String} recipient - Address người nhận
 * @param {String} sender - Address người gửi
 * @param {String} type - Loại thông báo: 'LIKE_POST', 'COMMENT_POST', 'FOLLOW'
 * @param {String} postId - ID bài viết liên quan
 * @param {String} message - Nội dung text thông báo
 */
export const sendNotification = async ({ req, recipient, sender, type, postId, message }) => {
  try {
    // 1. Validation: Không gửi thông báo cho chính mình
    if (!recipient || !sender) return;
    if (recipient.toLowerCase() === sender.toLowerCase()) return;

    // 2. Lưu thông báo vào MongoDB (Persistence)
    const newNotif = await Notification.create({
      recipient: recipient.toLowerCase(),
      sender: sender.toLowerCase(),
      type,
      postId,
      message, // Lưu message gốc (VD: "đã thích bài viết...")
      isRead: false,
      createdAt: new Date()
    });

    // 3. Lấy thông tin chi tiết người gửi (Avatar, Name) để hiển thị đẹp trên UI
    // (Bước này giúp Frontend không phải gọi thêm API để lấy avatar người gửi)
    const senderProfile = await User.findOne({ address: sender.toLowerCase() }).select('cachedName cachedAvatar');
    
    const notifDataForSocket = {
      _id: newNotif._id,
      recipient,
      sender: {
        address: sender,
        name: senderProfile?.cachedName || "Người dùng",
        avatar: senderProfile?.cachedAvatar || "https://via.placeholder.com/150"
      },
      type,
      postId,
      message, 
      createdAt: newNotif.createdAt,
      isRead: false
    };

    // 4. Kiểm tra xem người nhận có đang Online không?
    // req.userSocketMap được truyền từ middleware trong index.js
    const receiverSocketId = req.userSocketMap.get(recipient.toLowerCase());

    // 5. Nếu Online -> Bắn Socket ngay lập tức
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("receive_notification", notifDataForSocket);
      console.log(`🔔 Socket sent to [${recipient}]: ${type}`);
    } else {
      console.log(`zzz User [${recipient}] is offline. Notification saved to DB.`);
    }

  } catch (error) {
    console.error("❌ Send Notification Error:", error);
    // Không throw error để tránh làm crash luồng chính (VD: Like vẫn thành công dù lỗi notif)
  }
};