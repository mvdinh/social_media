import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useState, useMemo } from "react"; // Thêm useMemo để tối ưu
import Message from "./Message";
import ChatBox from "./ChatBox";
import Sidebar from "../components/Sidebar";
import SidebarGroup from "../components/Groups/SidebarGroup";
import NotificationPanel from "./Notification/Notification";
import UserMenuDropdown from "./UserMenuDrop";
import { dummyFollowersData } from "../assets/assets";

// Import Auth Context mới
import { useAuth1 } from "../context/Context";

// Import hook useNotifications
import { useNotifications } from "../hooks/useNotifications";

const Layout = () => {
  const location = useLocation();
  const isGroupRoute = location.pathname.startsWith("/groups");
  
  // Dùng Auth Context để check trạng thái đăng nhập (nếu cần)
  const { user } = useAuth1();

  // State quản lý Popup
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [popupChatUser, setPopupChatUser] = useState(null);

  // --- GỌI HOOK NOTIFICATION ---
  const { 
    notifications, 
    loading: notifLoading, 
    handleAction, 
    markAsRead, 
    markAllAsRead,
    refetch // Lấy thêm hàm refetch để gọi khi mở panel
  } = useNotifications();

  // Đếm số lượng chưa đọc (Dùng useMemo để tránh tính lại không cần thiết)
  const unreadCount = useMemo(() => {
    return notifications ? notifications.filter((n) => n.isUnread).length : 0;
  }, [notifications]);

  // --- HANDLERS ---

  const handleChatListToggle = () => {
    setIsChatListOpen((prev) => !prev);
    setIsNotificationOpen(false);
    setIsUserMenuOpen(false);
  };
  
  const handleNotificationToggle = () => {
    // Nếu đang đóng mà bấm mở -> Gọi refetch để lấy dữ liệu mới nhất
    if (!isNotificationOpen) {
        refetch();
    }
    setIsNotificationOpen((prev) => !prev);
    setIsChatListOpen(false);
    setIsUserMenuOpen(false);
  };
  
  const handleUserMenuToggle = () => {
    setIsUserMenuOpen((prev) => !prev);
    setIsChatListOpen(false);
    setIsNotificationOpen(false);
  };
  
  const handleChatSelect = (chatUser) => {
    setPopupChatUser(chatUser);
    setIsChatListOpen(false);
  };

  return (
    <div className="w-full flex-col h-screen">
      {/* NAVBAR */}
      <Navbar
        onMessageClick={handleChatListToggle}
        onNotification={handleNotificationToggle}
        onUser={handleUserMenuToggle}
        unreadCount={unreadCount} 
      />

      {/* POPUP: NOTIFICATION */}
      <div
        className={`fixed right-0 top-12 w-96 h-[500px] 
          bg-white shadow-2xl border border-gray-200 rounded-xl z-50
          origin-top-right transition-all duration-300 ${
            isNotificationOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <NotificationPanel 
          notifications={notifications}
          loading={notifLoading}
          onAction={handleAction}
          onRead={markAsRead}
          onMarkAllRead={markAllAsRead}
        />
      </div>

      {/* POPUP: CHAT LIST */}
      <div
        className={`fixed right-0 top-12 w-96 h-[500px] 
          bg-white shadow-2xl border border-gray-200 rounded-xl z-50
          origin-top-right transition-all duration-300 ${
            isChatListOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <Message onChatSelect={handleChatSelect} />
      </div>

      {/* POPUP: USER MENU */}
      <div
        className={`fixed right-0 top-12 w-96 h-[500px] 
          bg-white shadow-2xl border border-gray-200 rounded-xl z-50
          origin-top-right transition-all duration-300 ${
            isUserMenuOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        {/* Truyền user thật từ Context vào Menu, fallback sang dummy nếu chưa login */}
        <UserMenuDropdown user={user ? { name: user.username || user.address, avatar: user.avatar } : dummyFollowersData} />
      </div>

      {/* CHAT BOX (POPUP DƯỚI GÓC) */}
      {popupChatUser && (
        <ChatBox
          user={popupChatUser}
          onClose={() => setPopupChatUser(null)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex">
        {isGroupRoute ? (
          <div className="mt-10">
            <SidebarGroup />
          </div>
        ) : (
          <Sidebar />
        )}

        <div className="flex-1 bg-slate-50 mt-14 h-[calc(100vh-56px)] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;