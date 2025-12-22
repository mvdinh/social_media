import React from "react";

export const StoryCard = ({ 
  user, 
  media_url, 
  content,
  type, 
  backgroundColor, 
  onClick 
}) => {
  const profilePic = user?.avatar || user?.profile_picture;
  const username = user?.username || user?.full_name || 'user';

  // Logic xác định loại story
  const isTextStory = type === "story-text" || type === "Text";
  const isVideo = type === "Video" || (media_url && /\.(mp4|webm)$/i.test(media_url));

  // Class cho Text Story background
  const textBgClass = isTextStory ? (backgroundColor || "bg-gray-800") : "";

  return (
    <div
      onClick={onClick}
      className="relative flex-shrink-0 w-[120px] h-[200px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group"
    >
      
      {/* 1. Text Story */}
      {isTextStory && content && (
        <div className={`absolute inset-0 ${textBgClass} flex items-center justify-center p-3 text-center`}>
          <p className="text-white text-sm font-medium line-clamp-6 break-words">
            {content}
          </p>
        </div>
      )}
      
      {/* 2. Video Story */}
      {!isTextStory && isVideo && media_url && (
        <video 
          src={media_url} 
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
        />
      )}

      {/* 3. Image Story */}
      {!isTextStory && !isVideo && media_url && (
        <img 
          src={media_url} 
          alt="Story" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      )}

      {/* Fallback gradient nếu lỗi media */}
      {!isTextStory && !media_url && !content && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-cyan-400" />
      )}

      {/* ============================== */}
      {/* OVERLAY LAYER */}
      {/* ============================== */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
      
      {/* ============================== */}
      {/* USER INFO LAYER */}
      {/* ============================== */}
      
      {/* Avatar Ring */}
      <div className="absolute top-3 left-3 w-10 h-10 rounded-full border-2 border-blue-500 p-[2px]">
        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
          <img src={profilePic} alt={username} className="w-full h-full object-cover" />
        </div>
      </div>
      
      {/* Username */}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white text-xs font-semibold truncate drop-shadow-md">
          {username}
        </p>
      </div>
    </div>
  );
};