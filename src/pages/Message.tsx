import React from "react";
// Import icons từ lucide-react
import {
  Search,
  MoreHorizontal,
  Maximize,
  ExternalLink,
  Home,
} from "lucide-react";
// Import dữ liệu mẫu
import { dummyRecentMessagesData } from "../assets/assets";

// -----------------------------------------------------------------
// 1. COMPONENT: Message List Item (Mục tin nhắn đơn)
// -----------------------------------------------------------------
const MessageListItem = ({ chat, onSelect }) => {
  // Lấy thông tin người dùng đối diện (Giả định là from_user_id)
  const user = chat.from_user_id;
  const isUnread = !chat.seen;

  // Giả định logic hiển thị thời gian
  const displayTime = new Date(chat.createdAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
  });

  return (
    <div
      className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors duration-150 
                       ${
                         isUnread
                           ? "bg-indigo-50 hover:bg-indigo-100"
                           : "hover:bg-gray-100"
                       }`}
      onClick={() => onSelect(chat.from_user_id)}
    >
      {/* Avatar và Trạng thái online (Giả định chấm xanh) */}
      <div className="relative flex-shrink-0">
        <img
          src={user.profile_picture}
          alt={user.full_name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {/* Chấm xanh online (Giả định) */}
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
      </div>

      {/* Nội dung Tin nhắn */}
      <div className="flex-grow min-w-0 ml-3">
        <div className="flex items-center justify-between">
          <p
            className={`font-semibold truncate ${
              isUnread ? "text-gray-900" : "text-gray-800"
            }`}
          >
            {user.full_name}
          </p>
          <span
            className={`text-xs ml-2 ${
              isUnread ? "text-indigo-600 font-semibold" : "text-gray-500"
            }`}
          >
            {displayTime}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-sm truncate ${
              isUnread ? "text-indigo-700 font-medium" : "text-gray-600"
            }`}
          >
            {chat.text || "Đã gửi một ảnh."}
          </p>
          {/* Icon tắt thông báo (Giả định luôn có) */}
          <Home className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// 2. COMPONENT CHÍNH: Recent Message List
// -----------------------------------------------------------------
const Message = ({ onChatSelect }) => {
  // Các tab lọc
  const tabs = ["Tất cả", "Chưa đọc", "Nhóm"];
  const [activeTab, setActiveTab] = React.useState("Tất cả");

  return (
    <div className="w-full max-w-sm h-full bg-white shadow-xl rounded-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-gray-900">Đoạn chat</h2>
          <div className="flex space-x-2 text-gray-500">
            <MoreHorizontal className="w-6 h-6 cursor-pointer hover:text-gray-700" />
            <Maximize className="w-6 h-6 cursor-pointer hover:text-gray-700" />
            <ExternalLink className="w-6 h-6 cursor-pointer hover:text-gray-700" />
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm trên Messenger"
            className="w-full bg-gray-100 h-10 px-4 pl-10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* Bộ lọc (Tabs) */}
      <div className="flex items-center px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="flex space-x-2 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
          <MoreHorizontal className="w-6 h-6 text-gray-500 cursor-pointer self-center" />
        </div>
      </div>

      {/* Danh sách Tin nhắn */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {dummyRecentMessagesData.map((chat) => (
          <MessageListItem key={chat._id} chat={chat} onSelect={onChatSelect} />
        ))}

        {/* Mục Xem tất cả (Giả định) */}
        <div className="text-center py-4">
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Xem tất cả trong Messenger
          </a>
        </div>
      </div>
    </div>
  );
};

export default Message;
