import React from "react";
import { Image, Smile, Send } from "lucide-react";

interface ProfilePostsProps {
  posts?: any[];
  avatarUrl?: string; // Nhận thêm avatar để hiện trong khung đăng bài
}

export const ProfilePosts: React.FC<ProfilePostsProps> = ({ posts, avatarUrl }) => {
  return (
    <div className="space-y-6">
      {/* --- Create Post Box (Giả lập) --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3 mb-4">
            <img src={avatarUrl || ""} alt="User" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
            <div className="flex-1 bg-gray-100 rounded-full px-4 flex items-center cursor-pointer hover:bg-gray-200 transition">
                <span className="text-gray-500 text-sm">Bạn đang nghĩ gì thế?</span>
            </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 px-2">
            <div className="flex gap-4">
                <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition">
                    <Image size={18} className="text-green-500" /> Ảnh/Video
                </button>
                <button className="flex items-center gap-2 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-sm transition">
                    <Smile size={18} className="text-yellow-500" /> Cảm xúc
                </button>
            </div>
             {/* Nút đăng (Disabled vì chỉ là UI) */}
             <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                Đăng
             </button>
        </div>
      </div>

      {/* --- Posts List --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
        {posts && posts.length > 0 ? (
          <div className="w-full text-left">
              {/* Render posts here later */}
              <div>Danh sách bài viết...</div>
          </div>
        ) : (
          <div className="max-w-xs mx-auto">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image size={32} className="text-gray-400" />
             </div>
             <h3 className="text-lg font-semibold text-gray-900">Chưa có bài viết nào</h3>
             <p className="text-gray-500 mt-2 text-sm">Hãy chia sẻ những khoảnh khắc đầu tiên của bạn lên trang cá nhân nhé!</p>
          </div>
        )}
      </div>
    </div>
  );
};