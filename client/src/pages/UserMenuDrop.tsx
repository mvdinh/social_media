import {
  Settings,
  HelpCircle,
  Moon,
  MessageSquareText,
  LogOut,
  Users,
  ChevronRight,
} from "lucide-react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Settings, text: "Cài đặt và quyền riêng tư" },
  { icon: HelpCircle, text: "Trợ giúp và hỗ trợ" },
  { icon: Moon, text: "Màn hình và trợ năng" },
  { icon: MessageSquareText, text: "Đóng góp ý kiến", subtitle: "CTRL B" },
  { icon: LogOut, text: "Đăng xuất", action: "logout" },
];

const UserMenuDropdown = ({ user }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const menuItemClass =
    "flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 transition duration-150 cursor-pointer";
  const iconClass = "h-5 w-5 text-gray-600 mr-3";

  const handleLogout = async () => {
    try {
      const tokens = JSON.parse(localStorage.getItem("tokens"));
      if (tokens?.refreshToken) {
        await api.auth.logout(tokens.refreshToken);
      }
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.clear();
      navigate("/");
    }
  };

  const handleMenuClick = (item) => {
    if (item.action === "logout") {
      handleLogout();
    } else {
      console.log(`Clicked on: ${item.text}`);
      // Có thể điều hướng đến các trang khác ở đây
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden">
      {/* Profile Summary Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition duration-150">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-14 w-14 rounded-full object-cover border border-gray-100"
          />
          <div>
            <p className="font-semibold text-lg text-gray-900">{user.name}</p>
            <p className="text-gray-500 text-sm">Xem trang cá nhân của bạn</p>
          </div>
        </div>

        <div className="my-3 border-t border-gray-200"></div>

        <button className="w-full flex items-center justify-center py-2 px-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition duration-150">
          <Users className="h-5 w-5 mr-2" />
          Xem tất cả trang cá nhân
        </button>
      </div>

      {/* Menu Items */}
      <div className="p-2 pt-0">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={menuItemClass}
            onClick={() => handleMenuClick(item)}
          >
            <div
              className={`p-2 rounded-full bg-gray-200 ${
                item.text === "Đăng xuất" ? "bg-red-100" : ""
              }`}
            >
              <item.icon className={iconClass} />
            </div>
            <div className="flex-grow">
              <p
                className={`text-base ${
                  item.text === "Đăng xuất"
                    ? "text-red-600 font-medium"
                    : "text-gray-800"
                }`}
              >
                {item.text}
              </p>
              {item.subtitle && (
                <p className="text-gray-500 text-xs mt-0.5">{item.subtitle}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 ml-auto" />
          </div>
        ))}
      </div>

      <div className="p-4 pt-2 text-xs text-gray-500">
        <p className="leading-relaxed">
          Quyền riêng tư · Điều khoản · Quảng cáo · Lựa chọn quảng cáo{" "}
          <span className="text-blue-600">▷</span> · Cookie · Xem thêm
        </p>
      </div>
    </div>
  );
};

export default UserMenuDropdown;
