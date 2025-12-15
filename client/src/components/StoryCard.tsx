import React from "react";
import { Plus } from "lucide-react";
import getUrl from "../utils/getUrl"; // Đảm bảo đường dẫn import đúng

export const StoryCard = ({ 
  user, 
  media_url, 
  content, // ✅ Thêm prop content để hiển thị nội dung cho Text Story
  isCurrentUser = false, 
  type, 
  backgroundColor, 
  onClick 
}) => {
  // Xử lý avatar an toàn hơn
  const profilePic = user?.avatarIpfsHash 
    ? getUrl(user.avatarIpfsHash) 
    : user?.avatar || "https://via.placeholder.com/150";
    
  const username = user?.username || (typeof user === 'string' ? user : "User");

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
      {/* ==============================
          CASE 1: CREATE NEW STORY (Current User)
         ============================== */}
      {isCurrentUser ? (
        <div className="absolute inset-0 bg-white border border-gray-200 flex flex-col">
           {/* Phần ảnh trên (chiếm 70%) */}
           <div className="h-[70%] w-full relative overflow-hidden">
              <img 
                src={profilePic} 
                alt="Me" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
           </div>
           
           {/* Phần nút bấm dưới (chiếm 30%) */}
           <div className="h-[30%] w-full relative bg-white flex flex-col items-center justify-end pb-2">
              {/* Nút cộng tròn đè lên ranh giới */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-800 text-xs font-bold">Tạo tin</span>
           </div>
        </div>
      ) : (
        /* ==============================
           CASE 2: VIEW STORY (Other Users)
           ============================== */
        <>
          {/* --- CONTENT LAYER --- */}
          
          {/* 1. Text Story */}
          {isTextStory && (
            <div className={`absolute inset-0 ${textBgClass} flex items-center justify-center p-3 text-center`}>
               <p className="text-white text-xs font-medium line-clamp-6 break-words">
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
              // onMouseOver={event => event.target.play()} // Optional: Tự chạy khi hover
              // onMouseOut={event => event.target.pause()} 
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
          {!isTextStory && !media_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-cyan-400" />
          )}

          {/* --- OVERLAY LAYER --- */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
          
          {/* --- USER INFO LAYER --- */}
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
        </>
      )}
    </div>
  );
};