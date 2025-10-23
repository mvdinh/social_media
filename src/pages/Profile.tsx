import {
  Search,
  UserPlus,
  ThumbsUp,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { assets } from "../assets/assets";
const Profile = () => {
  // Constants cho style buttons bên phải
  const buttonClass =
    "flex items-center justify-center h-9 px-3 rounded-lg font-semibold text-sm transition duration-150";

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* KHU VỰC ẢNH BÌA & PROFILE */}
      <div className="bg-white shadow-md">
        {/* Ảnh Bìa (Cover Photo) */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1579468119853-27a4d53e8d7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MjM3NzZ8MHwxfHNlYXJjaHwzfHxqYXZhc2NyaXB0JTIwY292ZXIlMjBwaG90b3xlbnwwfHx8fDE3MDA2ODIzMjJ8MA&ixlib=rb-4.0.3&q=80&w=1080"
            alt="Cover Photo"
            className="w-full h-full object-cover"
          />
          {/* Bạn có thể thêm lớp phủ màu ở đây nếu cần */}
          <div className="absolute inset-0 bg-blue-900 bg-opacity-80 flex items-center justify-center p-8">
            <div className="text-white text-center">
              <div className="flex items-end justify-center space-x-2">
                <span className="text-5xl font-extrabold text-yellow-400">
                  Tips
                </span>
                <span className="text-5xl font-extrabold">Javascript</span>
              </div>
              <p className="text-lg mt-2 font-light tracking-wider italic border-t border-b border-gray-600 border-dashed pt-1 pb-1">
                Learn once, write everywhere — that's the JavaScript way.
              </p>
            </div>
          </div>
        </div>

        {/* Thông tin Page (Profile Info) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-12 pb-4">
            {/* Ảnh đại diện (Avatar) */}
            <div className="h-40 w-40 md:h-44 md:w-44 rounded-full border-4 border-white shadow-lg overflow-hidden flex-shrink-0 z-10">
              <img
                src={assets.sample_profile}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tên và Buttons */}
            <div className="ml-0 md:ml-4 mt-4 md:mt-0 flex-grow pt-8 md:pt-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Tips JavaScript
              </h1>
              <p className="text-gray-500 text-base mt-1">
                <span className="font-semibold text-gray-700">
                  28K người theo dõi
                </span>{" "}
                • 53 đang theo dõi
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-3 mb-4">
                {/* Nút Nhắn tin (Primary) */}
                <button
                  className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Nhắn tin
                </button>
                {/* Nút Theo dõi (Secondary) */}
                <button
                  className={`${buttonClass} bg-gray-200 text-gray-800 hover:bg-gray-300`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1.5" />
                  Theo dõi
                </button>
                {/* Nút Tìm kiếm (Tertiary) */}
                <button
                  className={`${buttonClass} bg-gray-200 text-gray-800 hover:bg-gray-300`}
                >
                  <Search className="h-4 w-4 mr-1.5" />
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              {/* Tabs */}
              <div className="flex space-x-1">
                {[
                  "Bài viết",
                  "Giới thiệu",
                  "Lượt nhắc",
                  "Đánh giá",
                  "Reels",
                  "Ảnh",
                ].map((tab, index) => (
                  <button
                    key={tab}
                    className={`h-full px-4 text-sm font-medium ${
                      index === 0 // Active tab (Bài viết)
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:bg-gray-100 rounded-lg"
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                {/* Xem thêm */}
                <button className="flex items-center px-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                  Xem thêm
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              </div>

              {/* Nút Menu thêm */}
              <button className="h-9 w-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-800 hover:bg-gray-300">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHU VỰC NỘI DUNG (Ví dụ) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            {/* Card Giới thiệu */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Giới thiệu</h2>
              <p className="text-gray-700">
                Đây là nơi chứa thông tin mô tả ngắn gọn về Page.
              </p>
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            {/* Card Đăng chú ý */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Đăng chú ý</h2>
              <div className="h-20 bg-gray-50 border border-gray-200 rounded p-3">
                Nội dung bài ghim
              </div>
            </div>
            {/* Card Tạo bài viết */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Tạo bài viết</h2>
              <div className="h-16 bg-gray-50 border border-gray-200 rounded p-3">
                Ô nhập nội dung...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
