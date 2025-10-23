import { NavLink } from "react-router-dom";
import MenuItem from "./MenuItem";
import { PlusCircle } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="hidden md:block w-64 p-4 border-r border-gray-200 bg-white sticky top-14 mt-14  h-[calc(100vh-56px)] overflow-y-auto flex-shrink-0">
      <MenuItem />

      <hr className="my-6 border-t border-gray-200" />

      {/* Nút Create Post (Độ dốc màu tím) */}
      <NavLink
        to="/create-post"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl 
                           text-white font-semibold text-lg
                           bg-gradient-to-r from-violet-600 to-indigo-600 
                           hover:from-violet-700 hover:to-indigo-700 
                           transition-all duration-300 shadow-lg shadow-indigo-500/50"
      >
        <PlusCircle className="w-6 h-6" />
        Create Post
      </NavLink>
    </div>
  );
};

export default Sidebar;
