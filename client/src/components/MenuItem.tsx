import { NavLink } from "react-router-dom";

// Giả định import menuItemsData
import { menuItemsData } from "../assets/assets";

const MenuItem = () => {
  const linkClass =
    "flex items-center gap-3 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-150";

  // Định nghĩa class cho trạng thái khi NavLink đang active
  const activeClass = ({ isActive }) =>
    isActive
      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-inner-sm" // Nền sáng, chữ nổi bật, chữ đậm
      : "text-gray-700 hover:bg-gray-100"; // Mặc định

  return (
    <nav className="flex flex-col space-y-2">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `${linkClass} ${activeClass({ isActive })}`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-base">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MenuItem;
