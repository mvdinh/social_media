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

const Navbar = ({ onMessageClick, onNotification, onUser }) => {
  const iconClass =
    "h-6 w-6 text-gray-500 hover:text-blue-600 transition duration-150";
  const activeIconClass = "h-7 w-7 text-blue-600";

  const rightButtonClass =
    "h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition duration-150";

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-md z-20">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center space-x-2">
          <div className="text-blue-600">
            <Search className="h-8 w-8" />
          </div>

          {/* Thanh tìm kiếm */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm trên Facebook"
              className="bg-gray-100 h-10 px-3 pl-10 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-52"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="hidden md:flex flex-grow justify-center h-full">
          <div className="flex space-x-2 md:space-x-12 h-full">
            {/* Nút Home (Active) */}
            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Home className={activeIconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-blue-600 rounded-t-sm"></div>
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Clapperboard className={iconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-transparent group-hover:bg-gray-200 transition duration-150"></div>
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Store className={iconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-transparent group-hover:bg-gray-200 transition duration-150"></div>
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <Users className={iconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-transparent group-hover:bg-gray-200 transition duration-150"></div>
            </div>

            <div className="flex items-center justify-center relative cursor-pointer group px-4">
              <User className={iconClass} />
              <div className="absolute bottom-0 w-full h-1 bg-transparent group-hover:bg-gray-200 transition duration-150"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-3">
          {/* Menu Dots */}
          <div className={rightButtonClass}>
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div className={rightButtonClass}>
            <MessageCircle className="h-6 w-6" onClick={onMessageClick} />
          </div>
          <div className={rightButtonClass}>
            <Bell className="h-6 w-6" onClick={onNotification} />
          </div>

          <div className="h-10 w-10 cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40"
              className="h-full w-full rounded-full object-cover"
              onClick={onUser}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
