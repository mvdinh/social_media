import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useState } from "react";
import Message from "./Message";
import ChatBox from "./ChatBox";
import Sidebar from "../components/Sidebar";
import SidebarGroup from "../components/Groups/SidebarGroup";
import NotificationPanel from "./Notification/Notification";
import UserMenuDropdown from "./UserMenuDrop";
import { dummyFollowersData } from "../assets/assets";
import useWallet from '../wallet/useWallet';

// Import hook useNotifications
import { useNotifications } from "../hooks/useNotifications";

const Layout = () => {
  const location = useLocation();
  const isGroupRoute = location.pathname.startsWith("/groups");
  const { 
        currentAccount, 
        connectWallet, 
        isLoading 
    } = useWallet();

  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isNotification, setIsNotification] = useState(false);
  const [isUser, setIsUser] = useState(false);
  const [popupChatUser, setPopupChatUser] = useState(null);

  // --- GỌI HOOK ---
  const { notifications, loading, handleAction, markAsRead, markAllAsRead } = useNotifications();

  // Đếm số lượng chưa đọc
  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const handleChatListToggle = () => {
    setIsChatListOpen((prev) => !prev);
    setIsNotification(false);
    setisNotification(false);
    setisUser(false);
  };
  
  const handleNotification = () => {
    setIsNotification((prev) => !prev);
    setIsChatListOpen(false);
    setisUser(false);
  };
  
  const handleUser = () => {
    setIsUser((prev) => !prev);
    setIsChatListOpen(false);
    setisNotification(false);
  };
  
  const handleChatSelect = (user: any) => {
    setPopupChatUser(user);
    setIsChatListOpen(false);
  };

  return (
    <div className="w-full flex-col h-screen">
      {/* Truyền số lượng xuống Navbar */}
      <Navbar
        onMessageClick={handleChatListToggle}
        onNotification={handleNotification}
        onUser={handleUser}
        unreadCount={unreadCount} 
      />

      {/* Popup Notification */}
      <div
        className={`fixed right-0 top-12 w-96 h-[500px] 
          bg-white shadow-2xl border border-gray-200 rounded-xl z-50
          origin-top-right transition-all duration-300 ${
            isNotification
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <NotificationPanel 
          notifications={notifications}
          loading={loading}
          onAction={handleAction}
          onRead={markAsRead}
          onMarkAllRead={markAllAsRead}
        />
      </div>

      {/* Các Popup khác giữ nguyên... */}
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

      <div
        className={`fixed right-0 top-12 w-96 h-[500px] 
          bg-white shadow-2xl border border-gray-200 rounded-xl z-50
          origin-top-right transition-all duration-300 ${
            isUser
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <UserMenuDropdown user={dummyFollowersData} />
      </div>

      {popupChatUser && (
        <ChatBox
          user={popupChatUser}
          onClose={() => setPopupChatUser(null)}
        />
      )}

      {/* MAIN LAYOUT */}
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