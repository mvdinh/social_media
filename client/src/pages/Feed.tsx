import React, { useState, useEffect } from "react";
import {
  Plus,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import {
  assets,
  dummyPostsData,
  dummyRecentMessagesData,
} from "../assets/assets";
import CreateStoryModal from "./CreateStory";
import StoryViewerModal from '../components/StoryViewerModal';
import axiosClient from "../api/axiosClient"; // Import axios client
import { useAuth1 } from "../context/Context"; // Import Auth Context mới
import ListPostPage from "./ListPostPage";

// -----------------------------------------------------------------
// 1. Story Card
// -----------------------------------------------------------------
const StoryCard = ({ user, media_url, isCurrentUser = false , type, backgroundColor, onClick }) => {
  // Fallback nếu không có avatar
  const profilePic = user?.profile_picture || assets.sample_profile;
  const username = user?.username || user || "User"; 

  let storyBg = "";
  let backgroundClass = "";
  const isTextStory = type === "story-text" || type === "Text";

  if (isTextStory) {
    backgroundClass = backgroundColor || "bg-gray-800";
  } else {
    storyBg = media_url
      ? `url(${media_url})`
      : "linear-gradient(135deg, #a78bfa, #4f46e5)";
  }

  return (
    <div
      className={`flex-shrink-0 w-24 h-40 rounded-xl overflow-hidden shadow-md cursor-pointer 
                  relative p-1 border-2 border-transparent hover:border-indigo-400 transition-colors ${backgroundClass}`}
      style={{
        backgroundImage: storyBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onClick={onClick}
    >
      {isCurrentUser ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 text-indigo-600">
          <Plus className="w-8 h-8" />
          <span className="text-sm font-semibold mt-1">Create Story</span>
        </div>
      ) : (
        <>
          <div className="absolute top-2 left-2 p-[2px] bg-indigo-500 rounded-full">
             <img
                src={profilePic}
                alt={username}
                className="w-7 h-7 rounded-full object-cover border border-white"
             />
          </div>
          <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate drop-shadow-md">
            {username.length > 10 ? `${username.slice(0, 10)}...` : username}
          </span>
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// 2. Post Card (Giữ nguyên)
// -----------------------------------------------------------------
const PostCard = ({ post }) => {
  const { user, content, image_urls, likes_count, createdAt } = post;
  const timeAgo = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const liked = likes_count.length > 0;
  const likesDisplay = likes_count.length || 140;
  const commentsDisplay = 12;
  const sharesDisplay = 7;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={user.profile_picture}
            alt={user.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-gray-900">{user.full_name}</span>
              {user.is_verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              @{user.username} · {timeAgo}
            </p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-gray-500 cursor-pointer" />
      </div>

      {content && (
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{content}</p>
      )}

      {image_urls?.length > 0 && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={image_urls[0]}
            alt="Post media"
            className="w-full object-cover max-h-96"
          />
        </div>
      )}

      <div className="flex items-center space-x-6 text-sm text-gray-500">
        <div className={`flex items-center space-x-1 cursor-pointer ${liked ? "text-red-500" : "hover:text-red-500"}`}>
          <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
          <span>{likesDisplay}</span>
        </div>
        <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-500">
          <MessageCircle className="w-5 h-5" />
          <span>{commentsDisplay}</span>
        </div>
        <div className="flex items-center space-x-1 cursor-pointer hover:text-green-500">
          <Share2 className="w-5 h-5" />
          <span>{sharesDisplay}</span>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// 3. Right Sidebar (Giữ nguyên)
// -----------------------------------------------------------------
const RightSidebar = () => (
  <div className="sticky top-20 space-y-6">
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-3">Recent Messages</h3>
      <ul className="space-y-3">
        {dummyRecentMessagesData.slice(0, 3).map((msg, index) => (
          <li key={index} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg">
            <img
              src={msg.from_user_id.profile_picture}
              alt={msg.from_user_id.full_name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="truncate">
              <p className="text-sm font-semibold truncate">
                {msg.from_user_id.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{msg.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// -----------------------------------------------------------------
// 4. Feed Page (Main Component)
// -----------------------------------------------------------------
const Feed = () => {
  // Dùng context mới để check loading (nếu cần hiển thị loading toàn trang)
  const { isLoading: authLoading } = useAuth1();

  const [stories, setStories] = useState([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState(null);

  // --- FETCH STORIES ---
  useEffect(() => {
    const fetchStories = async () => {
      try {
        // Dùng axiosClient gọi API lấy danh sách story (tự động xử lý refresh token nếu cần)
        // Endpoint: /story
        const response = await axiosClient.get("/story"); 
        
        // Data backend trả về là mảng story
        setStories(response.data); 
      } catch (error) {
        console.error("❌ Không thể lấy stories từ API:", error);
      } finally {
        setIsLoadingStories(false);
      }
    };

    fetchStories();
  }, [isCreateStoryOpen]); // Auto-refresh khi đóng modal tạo story

  // --- HANDLERS ---
  const handleViewStory = (storyMetadata) => {
      // Tìm index của story dựa trên _id hoặc ipfsHash
      // Nếu backend trả về _id thì dùng _id là tốt nhất
      const index = stories.findIndex(s => s._id === storyMetadata._id || s.ipfsHash === storyMetadata.ipfsHash);
      if (index !== -1) {
          setViewingStoryIndex(index);
      }
  };

  const handleCloseViewer = () => setViewingStoryIndex(null);

  const handleNextStory = () => {
      if (viewingStoryIndex !== null && viewingStoryIndex < stories.length - 1) {
          setViewingStoryIndex(viewingStoryIndex + 1);
      }
  };

  const handlePrevStory = () => {
      if (viewingStoryIndex !== null && viewingStoryIndex > 0) {
          setViewingStoryIndex(viewingStoryIndex - 1);
      }
  };

  const currentStory = viewingStoryIndex !== null ? stories[viewingStoryIndex] : null;

  return (
    <div className="bg-gray-50 min-h-screen pt-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 p-4">
        
        {/* CENTER COLUMN: Stories & Posts */}
        <div className="col-span-full md:col-span-4 lg:col-span-8">
          
          {/* STORIES SECTION */}
          <div className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Nút tạo Story của mình */}
              <StoryCard 
                isCurrentUser={true} 
                onClick={() => setIsCreateStoryOpen(true)}
              />
              
              {/* Danh sách Story từ Backend */}
              {isLoadingStories ? (
                 <div className="flex items-center justify-center w-full h-full min-w-[100px] text-gray-400 text-xs">Loading...</div>
              ) : (
                stories.map((story) => (
                  <StoryCard
                    key={story.ipfsHash || story._id}
                    // Backend trả về 'owner' (address), so sánh để biết có phải mình không
                    user={story.owner}
                    media_url={story.url}
                    type={story.type}
                    backgroundColor={story.backgroundColor}
                    onClick={() => handleViewStory(story)}
                  />
                ))
              )}
            </div>
          </div> 

          {/* POSTS SECTION */}
          <ListPostPage />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="hidden md:block md:col-span-4 lg:col-span-4">
          <RightSidebar />
        </div>
      </div>

      {/* MODAL: CREATE STORY */}
      {isCreateStoryOpen && (
        <CreateStoryModal onClose={() => setIsCreateStoryOpen(false)} />
      )}

      {/* MODAL: VIEW STORY */}
      {currentStory && (
          <StoryViewerModal 
              story={currentStory} 
              onClose={handleCloseViewer} 
              stories={stories} 
              currentIndex={viewingStoryIndex} 
              onNext={handleNextStory} 
              onPrev={handlePrevStory} 
              isLoading={false}
              // Bỏ currentUserAddress vì Modal tự check Token
          />
      )}

    </div>
  );
};

export default Feed;