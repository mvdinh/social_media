import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { useState } from "react";
import Message from "./Message";
import ChatBox from "./ChatBox";
import Sidebar from "../components/Sidebar";
import SidebarGroup from "../components/Groups/SidebarGroup"; // <-- sidebar mới
import NotificationPanel from "./Notification";
import UserMenuDropdown from "./UserMenuDrop";
import { dummyFollowersData } from "../assets/assets";

const Layout = () => {
  const location = useLocation(); // <-- Lấy URL hiện tại
  const isGroupRoute = location.pathname.startsWith("/groups"); // <-- kiểm tra
  
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [isNotification, setisNotification] = useState(false);
  const [isUser, setisUser] = useState(false);
  const [popupChatUser, setPopupChatUser] = useState(null);

  const handleChatListToggle = () => {
    setIsChatListOpen((prev) => !prev);
    setisNotification(false);
  };
  const handleNotification = () => {
    setisNotification((prev) => !prev);
    setIsChatListOpen(false);
  };
  const handleUser = () => {
    setisUser((prev) => !prev);
    setIsChatListOpen(false);
  };
  const handleChatSelect = (user) => {
    setPopupChatUser(user);
    setIsChatListOpen(false);
  };

  return (
    <div className="w-full flex-col h-screen">
      <Navbar
        onMessageClick={handleChatListToggle}
        onNotification={handleNotification}
        onUser={handleUser}
      />

      {/* Popup UI */}
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
            isNotification
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        <NotificationPanel onNotification={handleNotification} />
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
