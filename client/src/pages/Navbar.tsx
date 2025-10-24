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
import { useEffect, useState } from "react";

const Navbar = ({ onMessageClick, onNotification, onUser }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const iconClass =
    "h-6 w-6 text-gray-500 hover:text-blue-600 transition duration-150";
  const activeIconClass = "h-7 w-7 text-blue-600";

  const rightButtonClass =
    "h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition duration-150";

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-20">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Logo + tìm kiếm */}
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">
            <Search className="h-8 w-8" />
          </div>

          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="bg-gray-100 h-10 px-3 pl-10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          </div>
        </div>

        {/* Thanh giữa (menu) */}
        <div className="hidden md:flex flex-grow justify-center h-full">
          <div className="flex space-x-2 md:space-x-12 h-full">
            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Home className={activeIconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-blue-600 rounded-t-sm"></div>
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Clapperboard className={iconClass} />
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Store className={iconClass} />
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Users className={iconClass} />
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <User className={iconClass} />
            </div>
          </div>
        </div>

        {/* Bên phải */}
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className={rightButtonClass}>
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div className={rightButtonClass} onClick={onMessageClick}>
            <MessageCircle className="h-6 w-6" />
          </div>
          <div className={rightButtonClass} onClick={onNotification}>
            <Bell className="h-6 w-6" />
          </div>

          {/* Avatar + tên user */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={onUser}
          >
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-blue-500 text-white font-bold">
                  {user?.username
                    ? user.username.charAt(0).toUpperCase()
                    : "U"}
                </div>
              )}
            </div>
            {user?.username && (
              <span className="hidden md:block font-semibold text-gray-800">
                {user.username}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
