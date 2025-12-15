import React from "react";
import { formatTimeAgo } from "../../utils/dateFormatter";
import { MessageCircle, Heart, UserPlus, Bell } from "lucide-react";

const NotificationItem = ({ notification, onClick }) => {
  const { sender, type, message, isRead, createdAt } = notification;

  // Chọn icon nhỏ dựa theo loại thông báo
  const getIcon = () => {
    switch (type) {
      case "LIKE_POST":
        return <Heart className="w-3 h-3 text-white fill-current" />;
      case "COMMENT_POST":
        return <MessageCircle className="w-3 h-3 text-white fill-current" />;
      case "FOLLOW":
        return <UserPlus className="w-3 h-3 text-white fill-current" />;
      default:
        return <Bell className="w-3 h-3 text-white fill-current" />;
    }
  };

  // Chọn màu nền icon
  const getIconBgColor = () => {
    switch (type) {
      case "LIKE_POST": return "bg-red-500";
      case "COMMENT_POST": return "bg-green-500";
      case "FOLLOW": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 relative
        ${isRead ? "hover:bg-gray-100 bg-white" : "bg-blue-50 hover:bg-blue-100"}
      `}
    >
      {/* Avatar Wrapper */}
      <div className="relative shrink-0">
        <img
          src={sender?.avatar || "https://via.placeholder.com/40"}
          alt="avatar"
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
        />
        {/* Icon nhỏ góc dưới avatar */}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full border-2 border-white ${getIconBgColor()}`}>
           {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">
          <span className="font-bold text-gray-900">{sender?.username || "Người dùng"}</span>{" "}
          <span className="text-gray-600">{message}</span>
        </p>
        <p className={`text-xs mt-1 ${isRead ? "text-gray-500" : "text-blue-600 font-medium"}`}>
          {formatTimeAgo(createdAt)}
        </p>
      </div>

      {/* Dấu chấm xanh nếu chưa đọc */}
      {!isRead && (
        <div className="w-3 h-3 bg-blue-600 rounded-full shrink-0"></div>
      )}
    </div>
  );
};

export default NotificationItem;