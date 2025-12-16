import React, { useRef } from "react";
import { Camera, MapPin, Users } from "lucide-react";
import { assets } from "../../assets/assets";
import getUrl from "../../utils/getUrl";

interface ProfileHeaderProps {
  coverPhotoUrl?: string;
  avatarUrl: string;
  username: string;
  bio?: string; // Nhận thêm bio để hiển thị nhanh (tùy chọn)
  onAvatarClick: () => void;
  onCoverClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  coverPhotoUrl,
  avatarUrl,
  username,
  bio,
  onAvatarClick,
  onCoverClick,
}) => {
  const fileInputRefCover = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white shadow-sm rounded-b-xl overflow-hidden mb-6 relative group">
      {/* --- Cover Photo --- */}
      <div className="relative h-48 md:h-80 w-full bg-gray-300">
        <img
  src={
    coverPhotoUrl
      ? getUrl(coverPhotoUrl)
      : assets.sample_covern ||
        "https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/anh-bia-facebook-41.jpg"
  }
  className="w-full h-full object-cover"
/>

        {/* Gradient Overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Edit Cover Button */}
        <button
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 text-sm font-medium z-10"
          onClick={() => fileInputRefCover.current?.click()}
        >
          <Camera size={18} />
          <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
        </button>
        <input
          type="file"
          ref={fileInputRefCover}
          className="hidden"
          onChange={onCoverClick}
          accept="image/*"
        />
      </div>

      {/* --- Info Section --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12 relative">
          
          {/* Avatar */}
          <div className="relative group/avatar cursor-pointer" onClick={onAvatarClick}>
            <div className="h-32 w-32 md:h-44 md:w-44 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover transition transform group-hover/avatar:scale-105" 
              />
            </div>
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
               <Camera className="text-white w-8 h-8" />
            </div>
          </div>

          {/* User Name & Quick Info */}
          <div className="mt-4 md:mt-0 md:ml-6 flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{username}</h1>
            {bio && <p className="text-gray-600 mt-1 max-w-2xl">{bio}</p>}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500 font-medium">
               <span className="flex items-center gap-1">
                 <MapPin size={16} /> Việt Nam
               </span>
            </div>
          </div>

          {/* Actions (Optional - e.g., Add Story, Edit Profile) */}
          <div className="mt-4 md:mt-0 flex gap-3">
             {/* Có thể thêm nút phụ ở đây nếu cần */}
          </div>
        </div>
      </div>
    </div>
  );
};