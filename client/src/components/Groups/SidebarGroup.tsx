import { NavLink } from "react-router-dom";
import { Plus, Newspaper, Compass, Users, Search, Settings } from "lucide-react";

const SidebarGroup = () => {
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full px-4 py-3 flex items-center gap-3 rounded-lg transition-all duration-200
     ${isActive ? "" : "hover:bg-gray-50"}`;

  const getIconWrapperClass = ({ isActive }: { isActive: boolean }) =>
    `w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
      isActive ? "bg-blue-600" : "bg-gray-300"
    }`;

  const getIconClass = () => "w-5 h-5 text-white";

  return (
    <div className="w-[360px] bg-white border-r font-bold border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-8 pb-1">
        <h1 className="text-4xl font-bold text-b leading-tight">
          Nhóm
        </h1>
      </div>
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full outline-none focus:bg-gray-200 transition-all duration-200"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        <NavLink to="/groups" end className={getLinkClass}>
          {({ isActive }) => (
            <>
              <div className={getIconWrapperClass({ isActive })}>
                <Newspaper className={getIconClass()} />
              </div>
              <span className="flex-1 text-gray-900">Bảng feed của bạn</span>
            </>
          )}
        </NavLink>

        <NavLink to="/groups/discover" className={getLinkClass}>
          {({ isActive }) => (
            <>
              <div className={getIconWrapperClass({ isActive })}>
                <Compass className={getIconClass()} />
              </div>
              <span className="flex-1 text-gray-900">Khám phá</span>
            </>
          )}
        </NavLink>

        <NavLink to="/groups/joins" className={getLinkClass}>
          {({ isActive }) => (
            <>
              <div className={getIconWrapperClass({ isActive })}>
                <Users className={getIconClass()} />
              </div>
              <span className="flex-1 text-gray-900">Nhóm của bạn</span>
            </>
          )}
        </NavLink>
        <NavLink to="/groups/create" className={getLinkClass}>
          <button className="w-full flex items-center justify-center gap-2 text-blue-600 bg-blue-100 rounded-lg py-3 px-4 transition-all duration-200 cursor-pointer">
            <Plus className="w-5 h-5" />
            <span>Tạo nhóm mới</span>
          </button>
        </NavLink>
      </div>

      
    </div>
  );
};

export default SidebarGroup;
