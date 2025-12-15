import React, { useState, useEffect } from "react";
import { Plus, UserPlus, Search } from "lucide-react";
import { assets, dummyPostsData, dummyRecentMessagesData } from "../assets/assets";
import CreateStoryModal from "./CreateStory";
import StoryViewerModal from '../components/StoryViewerModal';
import axiosClient from "../api/axiosClient";
import { useAuth1 } from "../context/Context";
import ListPostPage from "./ListPostPage";
import { StoryCard } from "../components/StoryCard";
import { useChatSocket } from '../hooks/useChatSocket';

// Types
interface User {
  _id: string;
  address: string;
  username?: string;
  profile_picture?: string;
  full_name?: string;
}

interface Story {
  _id: string;
  ipfsHash?: string;
  user: User;
  media_url: string;
  type: string;
  backgroundColor?: string;
}

// -----------------------------------------------------------------
// Users Sidebar Component
// -----------------------------------------------------------------
const UsersSidebar: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosClient.get("/users");
        // Lọc bỏ user hiện tại
        const filteredUsers = response.data.users.filter((user: User) => user._id !== currentUserId);
        setUsers(filteredUsers);
      } catch (error) {
        console.error("❌ Không thể lấy danh sách users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Suggested for you</h3>
        
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <span className="text-sm text-gray-500">Loading users...</span>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <UserPlus className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// User Card Component
// -----------------------------------------------------------------
const UserCard: React.FC<{ user: User }> = ({ user }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Call API to follow/unfollow user
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
        {user.profile_picture ? (
          <img 
            src={user.profile_picture} 
            alt={user.username || user.full_name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
            {(user.username || user.full_name || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {user.username || user.full_name || 'Anonymous'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.full_name || `@${user.username}` || 'New user'}
        </p>
      </div>

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
          isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

// -----------------------------------------------------------------
// Feed Page (Main Component)
// -----------------------------------------------------------------
const Feed: React.FC = () => {
  // 1. Lấy thông tin User từ Context
  const { user: currentUser, isLoading: authLoading } = useAuth1();
  
  // 2. Kết nối Socket
  const { incomingMessage, onlineUsers } = useChatSocket(currentUser?.address || '');
  
  // 3. All states
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState<boolean>(true);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState<boolean>(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  // --- FETCH STORIES ---
  useEffect(() => {
    if (!currentUser) return;

    const fetchStories = async () => {
      try {
        const response = await axiosClient.get("/story");
        setStories(response.data);
      } catch (error) {
        console.error("❌ Không thể lấy stories từ API:", error);
      } finally {
        setIsLoadingStories(false);
      }
    };

    fetchStories();
  }, [isCreateStoryOpen, currentUser]);

  // --- HANDLERS ---
  const handleViewStory = (storyMetadata: Story) => {
    const index = stories.findIndex(
      s => s._id === storyMetadata._id || s.ipfsHash === storyMetadata.ipfsHash
    );
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

  // Early return
  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center gap-6 px-4 py-6 bg-gray-50 min-h-screen">
      {/* MAIN CONTENT */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {/* STORIES SECTION */}
        <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>

            {/* Nút tạo Story của mình */}
            <StoryCard
              user="You"
              isCurrentUser={true}
              onClick={() => setIsCreateStoryOpen(true)}
            />

            {/* Danh sách Story từ Backend */}
            {isLoadingStories ? (
              <div className="flex items-center justify-center w-full h-[200px] text-gray-400">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                  <span className="text-sm">Loading stories...</span>
                </div>
              </div>
            ) : (
              stories.map((story) => (
                <StoryCard
                  key={story._id || story.ipfsHash}
                  user={story.user}
                  media_url={story.media_url}
                  type={story.type}
                  backgroundColor={story.backgroundColor}
                  onClick={() => handleViewStory(story)}
                />
              ))
            )}
          </div>
        </div>

        {/* POSTS SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <ListPostPage />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="hidden lg:block flex-shrink-0 w-64">
        <div className="sticky top-6">
          <UsersSidebar currentUserId={currentUser._id} />
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
          onNext={handleNextStory}
          onPrev={handlePrevStory}
        />
      )}
    </div>
  );
};

export default Feed;