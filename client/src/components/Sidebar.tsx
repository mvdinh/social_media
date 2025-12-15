import { NavLink } from "react-router-dom";
import MenuItem from "./MenuItem";
import { PlusCircle } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="hidden md:block w-64 p-4 border-r border-gray-200 bg-white sticky top-14 mt-14  h-[calc(100vh-56px)] overflow-y-auto flex-shrink-0">
      <MenuItem />
    </div>
  );
};

export default Sidebar;
