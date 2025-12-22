import React, { useRef, useState, useEffect } from "react";
import { Camera, MapPin } from "lucide-react";
import { assets } from "../../assets/assets";
import getUrl from "../../utils/getUrl";

interface ProfileHeaderProps {
  coverPhotoUrl?: string;
  avatarUrl?: string; // Cho phép undefined để xử lý fallback
  username: string;
  bio?: string;
  // Thay đổi kiểu dữ liệu callback để nhận Event chứa file
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  coverPhotoUrl,
  avatarUrl,
  username,
  bio,
  onAvatarChange,
  onCoverChange,
}) => {
  // --- REFS ---
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // --- STATES cho Preview ---
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // --- CLEANUP URL ---
  // Giúp giải phóng bộ nhớ khi component unmount hoặc ảnh thay đổi
  useEffect(() => {
    return () => {
      if (previewCover) URL.revokeObjectURL(previewCover);
      if (previewAvatar) URL.revokeObjectURL(previewAvatar);
    };
  }, [previewCover, previewAvatar]);

  // --- HANDLERS ---
  
  // Xử lý chọn ảnh bìa
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewCover(objectUrl);
    }
    if (onCoverChange) onCoverChange(e);
  };

  // Xử lý chọn ảnh đại diện (MỚI)
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewAvatar(objectUrl); // Hiển thị ngay lập tức
    }
    if (onAvatarChange) onAvatarChange(e);
  };

  // --- LOGIC HIỂN THỊ ẢNH ---
  const displayCover = 
    previewCover || 
    (coverPhotoUrl ? getUrl(coverPhotoUrl) : null) || 
    assets.sample_cover || 
    "https://via.placeholder.com/1200x400";

  const displayAvatar = 
    previewAvatar || 
    (avatarUrl ? getUrl(avatarUrl) : null) || 
    assets.profile_icon || // Đảm bảo bạn có icon này trong assets
    "https://via.placeholder.com/150";

  return (
    <div className="bg-white shadow-sm rounded-b-xl overflow-hidden mb-6 relative group">
      {/* ================= COVER PHOTO ================= */}
      <div className="relative h-48 md:h-80 w-full bg-gray-300">
        <img
          src={displayCover}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Nút sửa ảnh bìa */}
        <button
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition flex items-center gap-2 text-sm font-medium z-10"
          onClick={() => coverInputRef.current?.click()}
        >
          <Camera size={18} />
          <span className="hidden sm:inline">Chỉnh sửa ảnh bìa</span>
        </button>
        
        {/* Input ẩn cho Cover */}
        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          onChange={handleCoverFileChange}
          accept="image/*"
        />
      </div>

      {/* ================= INFO SECTION ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col md:flex-row items-center md:items-end -mt-16 md:-mt-12 relative">
          
          {/* --- AVATAR (Click để đổi) --- */}
          <div 
            className="relative group/avatar cursor-pointer z-20" 
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="h-32 w-32 md:h-44 md:w-44 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white relative">
              <img 
                src={displayAvatar} 
                alt="Avatar" 
                className="w-full h-full object-cover transition transform group-hover/avatar:scale-105" 
              />
              
              {/* Overlay khi hover vào avatar */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                 <Camera className="text-white w-8 h-8 drop-shadow-lg" />
              </div>
            </div>

            {/* Input ẩn cho Avatar */}
            <input
              type="file"
              ref={avatarInputRef}
              className="hidden"
              onChange={handleAvatarFileChange} // Gọi hàm xử lý mới
              accept="image/*"
            />
          </div>

          {/* --- USER NAME & INFO --- */}
          <div className="mt-4 md:mt-0 md:ml-6 flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{username}</h1>
            {bio && <p className="text-gray-600 mt-1 max-w-2xl">{bio}</p>}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500 font-medium">
               <span className="flex items-center gap-1 hover:text-blue-600 transition cursor-pointer">
                 <MapPin size={16} /> Việt Nam
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};