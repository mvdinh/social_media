import React from "react";
import {
  Bell,
  Clapperboard,
  Home,
  LayoutGrid,
  MessageCircle,
  Search,
  Store,
  User,
  Users,
} from "lucide-react";
import { useAuth1 } from "../context/Context";
import { Link, useLocation } from "react-router-dom";
import getUrl from "../utils/getUrl";

// ✅ Nhận unreadCount từ props
const Navbar = ({ onMessageClick, onNotification, onUser, unreadCount = 0 }) => {
  const { user } = useAuth1();
  const location = useLocation();
  const pathname = location.pathname;

  const iconClass = "h-6 w-6 text-gray-500 hover:text-blue-600 transition duration-150";
  const activeIconClass = "h-7 w-7 text-blue-600";
  
  // Thêm relative để định vị số đỏ (badge)
  const rightButtonClass =
    "h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition duration-150 relative";

  const isActive = (path) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-20">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        
        {/* --- LEFT: LOGO & SEARCH --- */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="text-blue-600">
            {/* Logo Facebook hoặc App */}
            <svg viewBox="0 0 36 36" className="h-10 w-10 fill-current" >
               <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.442 5.811 15.526 13.652 17.471L14 27.471v-9.563h-3.23v-3.805h3.23v-2.78c0-3.189 1.91-4.945 4.793-4.945 1.381 0 2.825.246 2.825.246v3.107h-1.592c-1.58 0-2.074.981-2.074 1.987v2.385h3.51l-.561 3.805h-2.949v10.435l1.229-.471z"></path>
            </svg>
          </Link>

          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm trên Facebook"
              className="bg-gray-100 h-10 px-3 pl-10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-60"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* --- CENTER: NAVIGATION --- */}
        <div className="hidden md:flex flex-grow justify-center h-full">
          <div className="flex space-x-2 md:space-x-10 h-full">
            <Link to="/feed" className="flex items-center justify-center relative group px-4">
              <Home className={isActive("/feed") ? activeIconClass : iconClass} />
              <div className={`absolute bottom-0 w-full h-1 rounded-t-sm transition duration-150 ${isActive("/feed") ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-200"}`}></div>
            </Link>

            <Link to="/friends/requests" className="flex items-center justify-center relative group px-4">
              <Users className={isActive("/friends") ? activeIconClass : iconClass} />
               <div className={`absolute bottom-0 w-full h-1 rounded-t-sm transition duration-150 ${isActive("/friends") ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-200"}`}></div>
            </Link>

            <Link to="/watch" className="flex items-center justify-center relative group px-4">
              <Clapperboard className={isActive("/watch") ? activeIconClass : iconClass} />
               <div className={`absolute bottom-0 w-full h-1 rounded-t-sm transition duration-150 ${isActive("/watch") ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-200"}`}></div>
            </Link>

            <Link to="/store" className="flex items-center justify-center relative group px-4">
              <Store className={isActive("/store") ? activeIconClass : iconClass} />
               <div className={`absolute bottom-0 w-full h-1 rounded-t-sm transition duration-150 ${isActive("/store") ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-200"}`}></div>
            </Link>
            
             <Link to="/profile" className="flex items-center justify-center relative group px-4">
              <User className={isActive("/profile") ? activeIconClass : iconClass} />
               <div className={`absolute bottom-0 w-full h-1 rounded-t-sm transition duration-150 ${isActive("/profile") ? "bg-blue-600" : "bg-transparent group-hover:bg-gray-200"}`}></div>
            </Link>
          </div>
        </div>

        {/* --- RIGHT: ACTIONS & PROFILE --- */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className={rightButtonClass}>
            <LayoutGrid className="h-6 w-6" />
          </div>
          
          <div className={rightButtonClass} onClick={onMessageClick}>
            <MessageCircle className="h-6 w-6" />
          </div>

          {/* ✅ NÚT THÔNG BÁO */}
          <div className={rightButtonClass} onClick={onNotification}>
            <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'text-blue-600 fill-current' : ''}`} />
            
            {/* Logic hiển thị Badge số đỏ */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white min-w-[20px] text-center flex items-center justify-center shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="h-10 w-10 cursor-pointer ml-1">
            <img
              src={user?.avatarIpfsHash ? getUrl(user.avatarIpfsHash) : user?.avatar || "https://via.placeholder.com/40"}
              className="h-full w-full rounded-full object-cover border border-gray-200"
              onClick={onUser}
              alt="avatar"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;