import React from "react";
import { MoreHorizontal } from "lucide-react";

// Dữ liệu giả lập cho các thông báo
const notificationsData = [
  {
    group: "Hôm nay",
    items: [
      {
        id: 1,
        name: "Nguyễn Thị Hoài Thu",
        action:
          "đã thêm 6 thước phim mới: Gửi XH: Hãy bảo dung với người mẹ hơn...",
        context: "21 giờ · 7 cảm xúc · 2 bình luận",
        avatar:
          "https://images.unsplash.com/photo-1549405604-585a97321e1a?q=80&w=40",
        typeIcon: "video",
        isUnread: true,
      },
      {
        id: 2,
        name: "Hội VinFast VF5, VF 5 Việt Nam™...",
        action: "CHƯƠNG TRÌNH MUA XE VF5 0 ĐỒNG VẪN CÒN TIẾP...",
        context: "3 giờ",
        avatar:
          "https://images.unsplash.com/photo-1552519507-da3b1a8d0119?q=80&w=40",
        typeIcon: "group",
        isUnread: true,
      },
    ],
  },
  {
    group: "Trước đó",
    items: [
      {
        id: 3,
        name: "Lập trình viên .Net C#",
        action:
          "[BnK-HN]onsite Tuyển fullstack (ReactJs + .Net)>3y, domain tài chính....",
        context: "3 ngày",
        avatar:
          "https://images.unsplash.com/photo-1610484826967-0e695d7301c2?q=80&w=40",
        typeIcon: "group",
        isUnread: true,
      },
      {
        id: 4,
        name: "Phòng Trọ Triều Khúc- Phùng...",
        action:
          "Hơn 3tr, Triều Khúc, full đồ, tủ lạnh máy giặt riêng, thang máy,...",
        context: "4 ngày",
        avatar:
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0b9a?q=80&w=40",
        typeIcon: "group",
        isUnread: false,
      },
      {
        id: 5,
        name: "LapTop - PC - Phụ Kiện",
        action: "đã đăng trong Thanh Lý LapTop - Máy Tính Giá Rẻ.",
        context: "6 ngày",
        avatar:
          "https://images.unsplash.com/photo-1541450847053-4339e3760ee5?q=80&w=40",
        typeIcon: "group",
        isUnread: false,
      },
    ],
  },
];

// Sub-Component: Một mục thông báo đơn lẻ
const NotificationItem = ({ item }) => {
  const { name, action, context, avatar, typeIcon, isUnread } = item;

  // Màu sắc và Icon giả lập (vì trong hình là overlay icon)
  const iconBg = typeIcon === "video" ? "bg-red-500" : "bg-blue-600";
  const Icon = typeIcon === "video" ? "📽️" : "👥";

  return (
    <div
      className={`flex items-start p-2 cursor-pointer rounded-lg hover:bg-gray-100 transition duration-150 ${
        isUnread ? "bg-blue-50" : ""
      }`}
    >
      {/* Avatar và Icon Overlay */}
      <div className="relative flex-shrink-0 mr-3">
        <img
          src={avatar}
          alt="Avatar"
          className="h-14 w-14 rounded-full object-cover"
        />
        <div
          className={`absolute bottom-0 right-0 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white ${iconBg} border-2 border-white`}
        >
          {Icon}
        </div>
      </div>

      {/* Nội dung thông báo */}
      <div className="flex-grow min-w-0 pr-3">
        <p className="text-sm">
          <span className="font-semibold">{name} </span>
          {action}
        </p>
        <p
          className={`text-xs mt-0.5 ${
            isUnread ? "text-blue-600 font-medium" : "text-gray-500"
          }`}
        >
          {context}
        </p>
      </div>

      {/* Dấu chấm trạng thái chưa đọc */}
      {isUnread && (
        <div className="flex-shrink-0 ml-auto pt-5">
          <div className="h-2.5 w-2.5 bg-blue-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

const NotificationPanel = ({ onNotification }) => {
  // Styles cho tab
  const tabClass =
    "px-3 py-1.5 font-semibold text-base rounded-lg transition duration-150";

  return (
    // Container bao bọc (giả định đây là một panel xuất hiện ở góc trên bên phải)

    <div className="bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <button
          className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition"
          aria-label="More options"
        >
          <MoreHorizontal className="h-6 w-6" />
        </button>
      </div>

      {/* TABS (Tất cả / Chưa đọc) */}
      <div className="flex space-x-2 px-4 pb-2 border-b border-gray-100">
        <button className={`${tabClass} bg-blue-100 text-blue-600`}>
          Tất cả
        </button>
        <button className={`${tabClass} text-gray-700 hover:bg-gray-100`}>
          Chưa đọc
        </button>
      </div>

      {/* NOTIFICATIONS LIST (Có thanh cuộn) */}
      <div className="max-h-[80vh] overflow-y-auto pt-2">
        {notificationsData.map((group) => (
          <div key={group.group} className="px-2 pb-4">
            {/* GROUP HEADER (Hôm nay, Trước đó) */}
            <div className="flex justify-between items-center px-2 py-1">
              <h3 className="text-lg font-bold text-gray-800">{group.group}</h3>
              {group.group === "Trước đó" && (
                <button className="text-blue-600 text-sm hover:underline">
                  Xem tất cả
                </button>
              )}
            </div>

            {/* Danh sách thông báo theo nhóm */}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NotificationItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer Button (Xem thông báo trước đó) */}
        <div className="p-4 pt-1">
          <button className="w-full text-center text-sm font-semibold text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition">
            Xem thông báo trước đó
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
