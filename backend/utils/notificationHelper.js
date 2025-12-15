// utils/notificationHelper.js
import Notification from "../models/notification.js";
import User from "../models/user.js"; // Import User model nếu cần populate sâu

export const sendNotification = async ({ req, recipient, sender, type, postId, message }) => {
  try {
    // 1. Validate cơ bản
    if (!recipient || !sender) return;
    
    // Chuẩn hóa address
    const recipientAddr = recipient.toLowerCase();
    const senderAddr = sender.toLowerCase();

    // Không gửi thông báo nếu tự like/comment bài mình
    if (recipientAddr === senderAddr) return;

    // 2. Tìm ID của người gửi (để lưu vào DB dạng ObjectId cho dễ populate sau này)
    // Nếu sender truyền vào là address string, ta tìm user._id
    const senderUser = await User.findOne({ address: senderAddr });
    const senderId = senderUser ? senderUser._id : null;

    // 3. Lưu Notification vào MongoDB
    const newNotification = await Notification.create({
      recipient: recipientAddr, // Lưu address người nhận
      sender: senderId,         // Lưu ObjectId người gửi (để populate avatar)
      type,                     // 'LIKE_POST', 'COMMENT_POST'
      post: postId,
      content: message,
      isRead: false,
      createdAt: new Date()
    });

    // Populate thông tin người gửi (avatar, username) để hiển thị ngay trên UI
    const populatedNotif = await Notification.findById(newNotification._id)
        .populate("sender", "username avatar address");

    // 4. Gửi Real-time qua Socket.IO
    // Lấy map và io từ req (đã được middleware ở server.js gán vào)
    const socketMap = req.userSocketMap;
    const io = req.io;

    if (socketMap && io) {
        // Tìm socketId của người nhận dựa trên address
        const recipientSocketId = socketMap.get(recipientAddr);
        
        if (recipientSocketId) {
            // Chỉ gửi cho đúng người đó
            io.to(recipientSocketId).emit("new_notification", populatedNotif);
            console.log(`🔔 Sent notification to ${recipientAddr} (Socket: ${recipientSocketId})`);
        } else {
            console.log(`zzz User ${recipientAddr} is offline. Notification saved to DB.`);
        }
    }

  } catch (error) {
    console.error("❌ Notification Error:", error);
  }
};