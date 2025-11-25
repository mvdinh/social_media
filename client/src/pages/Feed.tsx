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

  // -----------------------------------------------------------------
  // 1. Story Card
  // -----------------------------------------------------------------
  const StoryCard = ({ user, media_url, isCurrentUser = false , type, content, backgroundColor, onClick }) => {
    const profilePic = user?.profile_picture || assets.sample_profile;

    // Quyết định background
    let storyBg = "";
    let backgroundClass = "";
    const isTextStory = type === "story-text";

    if (isTextStory) {
      // Nếu là story text, dùng class màu
      backgroundClass = backgroundColor;
    } else {
      // Nếu là story ảnh, dùng backgroundImage
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
            <img
              src={profilePic}
              alt={user?.username}
              className="w-8 h-8 rounded-full object-cover absolute top-2 left-2 border-2 border-white"
            />
            <span className="absolute bottom-5 left-1 right-1 text-white text-xs font-semibold truncate drop-shadow">
              {user?.username}
            </span>
          </>
        )}
      </div>
    );
  };

  // -----------------------------------------------------------------
  // 2. Post Card
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
        {/* Header */}
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

        {/* Content */}
        {content && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{content}</p>
        )}

        {/* Media */}
        {image_urls?.length > 0 && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={image_urls[0]}
              alt="Post media"
              className="w-full object-cover max-h-96"
            />
          </div>
        )}

        {/* Interactions */}
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div
            className={`flex items-center space-x-1 cursor-pointer ${
              liked ? "text-red-500" : "hover:text-red-500"
            }`}
          >
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
  // 3. Right Sidebar
  // -----------------------------------------------------------------
  const RightSidebar = () => (
    <div className="sticky top-4 space-y-6">
      {/* Sponsored Ad */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Sponsored</h3>
        <img
          src={assets.sponsored_img || "https://via.placeholder.com/300x150"}
          alt="Sponsored Ad"
          className="w-full rounded-lg mb-3 object-cover"
        />
        <h4 className="text-sm font-bold text-gray-900">Email marketing</h4>
        <p className="text-xs text-gray-600">
          Supercharge your marketing with a powerful, easy-to-use platform built
          for results.
        </p>
      </div>

      {/* Recent Messages */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Messages</h3>
        <ul className="space-y-3">
          {dummyRecentMessagesData.slice(0, 3).map((msg, index) => (
            <li
              key={index}
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg"
            >
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
  // 4. Feed Page
  // -----------------------------------------------------------------
  const Feed = () => {
    // 1. Tạo state để lưu trữ stories
    const [stories, setStories] = useState([]);
    const [isLoadingStories, setIsLoadingStories] = useState(true);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);

    const [viewingStoryIndex, setViewingStoryIndex] = useState(null);

    // 2. Dùng useEffect để gọi API khi component được render
    useEffect(() => {
      // Định nghĩa một hàm async bên trong để fetch dữ liệu
      const fetchStories = async () => {
        try {
          // Thay đổi URL nếu API của bạn chạy trên port khác
          const response = await fetch("http://localhost:5000/"); 
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          const data = await response.json();
          
          // 3. Cập nhật state với dữ liệu từ API
          setStories(data); 
        } catch (error) {
          console.error("❌ Không thể lấy stories từ API:", error);
        } finally {
          setIsLoadingStories(false); // Dừng loading
        }
      };

      fetchStories(); // Gọi hàm fetch
    }, [isCreateStoryOpen]); // isCreateStoryOpen để auto-refresh

    // HÀM XEM STORY CHI TIẾT
    const handleViewStory = async (storyMetadata) => {
        // Tìm index của story được click
        const index = stories.findIndex(s => s.ipfsHash === storyMetadata.ipfsHash);
        if (index !== -1) {
            setViewingStoryIndex(index);
        } else {
             console.error("Story not found in the current list.");
        }
    };

    // HÀM ĐÓNG MODAL
    const handleCloseViewer = () => {
        setViewingStoryIndex(null);
    };

    // 💡 HÀM CHUYỂN STORY TIẾP THEO
    const handleNextStory = () => {
        if (viewingStoryIndex !== null && viewingStoryIndex < stories.length - 1) {
            setViewingStoryIndex(viewingStoryIndex + 1);
        }
    };

    // 💡 HÀM CHUYỂN STORY TRƯỚC
    const handlePrevStory = () => {
        if (viewingStoryIndex !== null && viewingStoryIndex > 0) {
            setViewingStoryIndex(viewingStoryIndex - 1);
        }
    };

    // 💡 Lấy Story hiện tại từ Index
    const currentStory = viewingStoryIndex !== null ? stories[viewingStoryIndex] : null;

    return (
      <div className="bg-gray-50 min-h-screen ">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 p-4">
          {/* Center: Stories & Posts */}
          <div className="col-span-full md:col-span-4 lg:col-span-8">
            {/* Stories */}
            <div className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                <StoryCard 
                  isCurrentUser={true} 
                  onClick={() => setIsCreateStoryOpen(true)}
                />
                {stories.map((story) => (
                  <StoryCard
                    key={story.ipfsHash}
                    user={story.owner}
                    media_url={story.url}
                    type={story.type}
                    content={story.content}
                    backgroundColor={story.backgroundColor}
                    onClick={() => handleViewStory(story)}
                  />
                ))}
              </div>
            </div> 

            {/* Posts */}
            <div className="space-y-6">
              {dummyPostsData.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden md:block md:col-span-4 lg:col-span-4">
            <RightSidebar />
          </div>
        </div>

        {isCreateStoryOpen && (
          <CreateStoryModal onClose={() => setIsCreateStoryOpen(false)} />
        )}

        {currentStory && (
            <StoryViewerModal 
                story={currentStory} // Story hiện tại
                onClose={handleCloseViewer} 
                stories={stories} 
                currentIndex={viewingStoryIndex} 
                onNext={handleNextStory} 
                onPrev={handlePrevStory} 
            />
        )}

      </div>
    );
  };

  export default Feed;
