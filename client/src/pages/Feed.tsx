import React from "react";
import { useAuth1 } from "../context/Context";
import { useChatSocket } from '../hooks/useChatSocket';
import ListPostPage from "./ListPostPage";
import UsersSidebar from "../components/UserSidebar/UsersSidebar";
import StoriesSection from "../components/Story/StoriesSection";

const Feed = () => {
  const { user: currentUser, isLoading: authLoading } = useAuth1();
  const { incomingMessage, onlineUsers } = useChatSocket(currentUser?.address || '');

  // Early return nếu chưa có user
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
        
        {/* STORIES SECTION - Component độc lập, không có background */}
        <StoriesSection currentUser={currentUser} />

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
    </div>
  );
};

export default Feed;