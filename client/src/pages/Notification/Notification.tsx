import React from "react";
import NotificationItem from "./NotificationItem";
import { CheckCheck, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationPanel = ({ 
  notifications, 
  loading, 
  onRead,      // Hàm đánh dấu đã đọc (từ Hook)
  onMarkAllRead // Hàm đánh dấu tất cả đã đọc (từ Hook)
}) => {
  const navigate = useNavigate();

  // Xử lý khi click vào thông báo
  const handleClick = (notif) => {
    // 1. Gọi API đánh dấu đã đọc
    if (!notif.isRead) {
      onRead(notif._id);
    }

    // 2. Điều hướng tùy theo loại
    if (notif.postId) {
      // Nếu là like/comment -> Chuyển đến trang chi tiết bài viết
      // Giả sử đường dẫn là /post/:id
      navigate(`/post/${typeof notif.postId === 'object' ? notif.postId._id : notif.postId}`);
    } else if (notif.type === "FOLLOW") {
      // Nếu là follow -> Chuyển đến trang cá nhân người đó
      navigate(`/profile/${notif.sender._id}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-800">Thông báo</h2>
        
        {notifications.length > 0 && (
          <button 
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition"
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Đã đọc tất cả</span>
          </button>
        )}
      </div>

      {/* --- BODY LIST --- */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide custom-scrollbar">
        {loading ? (
          // Loading Skeleton
          <div className="space-y-3 p-2">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="flex gap-3 animate-pulse">
                 <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                 <div className="flex-1 space-y-2 py-1">
                   <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                 </div>
               </div>
             ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
            <BellOff className="w-16 h-16 mb-2 opacity-50" />
            <p>Bạn chưa có thông báo nào</p>
          </div>
        ) : (
          // List Notifications
          <div className="space-y-1">
            {notifications.map((notif) => (
              <NotificationItem 
                key={notif._id} 
                notification={notif} 
                onClick={() => handleClick(notif)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer (Optional) */}
      <div className="p-2 border-t border-gray-100 text-center">
         <button className="text-sm text-blue-600 hover:underline">Xem tất cả</button>
      </div>
    </div>
  );
};

export default NotificationPanel;