import React from "react";
// Import icons từ lucide-react
import { Phone, Video, Minus, X, Smile, ThumbsUp, Plus } from "lucide-react";
import { dummyMessagesData } from "../assets/assets";
// Import dữ liệu mẫu

// --- Component phụ: Message Bubble (Dùng cho Pop-up) ---
const PopUpMessageBubble = ({ text, isSender }) => {
  // Giả định logic lọc tin nhắn
  const textToDisplay = text.trim() === "" ? "[Ảnh]" : text;

  const bubbleClass = isSender
    ? // Tin nhắn của người dùng hiện tại (Blue/Purple)
      "ml-auto bg-violet-600 text-white rounded-br-none"
    : // Tin nhắn của người đối diện (Gray)
      "mr-auto bg-gray-200 text-gray-800 rounded-tl-none";

  return (
    <div
      className={`flex w-full ${
        isSender ? "justify-end" : "justify-start"
      } mb-2`}
    >
      <div
        className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${bubbleClass}`}
      >
        {textToDisplay}
      </div>
    </div>
  );
};

// --- Component Chính: Chat Pop-up ---
// Nhận user, onClose, onMinimize từ MainLayout
const ChatBox = ({ user, onClose, onMinimize }) => {
  // Giả định dữ liệu tin nhắn mẫu (Chỉ để hiển thị cấu trúc)
  // Trong ứng dụng thực tế, dữ liệu này phải được fetch dựa trên user.id
  // const mockMessages = [
  //   { id: 1, text: "Tiếng anh", isSender: false },
  //   { id: 2, text: "TACN ak", isSender: true },
  //   { id: 3, text: "Ko", isSender: false },
  //   { id: 4, text: "Giao tiếp", isSender: false },
  //   { id: 5, text: "Ko phải học", isSender: false },
  //   { id: 6, text: "Mai t gánh", isSender: false },
  //   { id: 7, text: "Nhận được tablet chưa?", isSender: true },
  //   { id: 8, text: "Cái này là ảnh đó.", isSender: false, media: true },
  // ];

  // Giả định trạng thái: Đang hoạt động
  const isActive = true;

  return (
    <div className="fixed right-6 bottom-0 w-80 h-96 bg-white shadow-2xl rounded-t-xl flex flex-col overflow-hidden z-50">
      {/* Header Cửa sổ Chat */}
      <div
        className={`flex items-center justify-between p-2.5 ${
          isActive ? "bg-blue-600" : "bg-gray-300"
        } text-white flex-shrink-0`}
      >
        <div className="flex items-center space-x-2 cursor-pointer">
          <img
            src={user.profile_picture}
            alt={user.full_name}
            className="w-7 h-7 rounded-full object-cover border border-white"
          />
          <div>
            <p className="text-sm font-semibold truncate max-w-[100px]">
              {user.full_name}
            </p>
            <p className="text-xs opacity-80">Đang hoạt động</p>
          </div>
        </div>
        {/* Nút Hành động */}
        <div className="flex space-x-2">
          <Video className="w-5 h-5 cursor-pointer hover:opacity-80" />
          <Phone className="w-5 h-5 cursor-pointer hover:opacity-80" />
          <Minus
            className="w-5 h-5 cursor-pointer hover:opacity-80"
            onClick={onMinimize}
          />
          <X
            className="w-5 h-5 cursor-pointer hover:opacity-80"
            onClick={onClose}
          />
        </div>
      </div>

      {/* Khu vực Tin nhắn */}
      <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar bg-white">
        {dummyMessagesData.map((msg) => (
          <PopUpMessageBubble
            key={msg._id}
            text={msg.text}
            isSender={msg.seen}
          />
        ))}
      </div>

      {/* Thanh nhập liệu */}
      <div className="flex items-center p-2.5 border-t border-gray-200 flex-shrink-0">
        <Plus className="w-6 h-6 text-blue-600 cursor-pointer hover:text-blue-700 mr-1" />

        {/* Thanh nhập liệu chính */}
        <div className="flex-grow flex items-center bg-gray-100 rounded-full px-2">
          <input
            type="text"
            placeholder="Aa"
            className="flex-grow py-1.5 px-1 bg-gray-100 focus:outline-none text-sm"
          />
          <Smile className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 ml-1" />
        </div>

        {/* Các icon bên phải */}
        <ThumbsUp className="w-6 h-6 text-blue-600 cursor-pointer hover:text-blue-700 ml-2" />
      </div>
    </div>
  );
};

export default ChatBox;
