import React from "react";
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
  dummyStoriesData,
  dummyPostsData,
  dummyRecentMessagesData,
} from "../assets/assets";
import ListPosts from "../Test/ListPosts";

// -----------------------------------------------------------------
// 1. Story Card
// -----------------------------------------------------------------
const StoryCard = ({ user, media_url, isCurrentUser = false }) => {
  const profilePic = user?.profile_picture || assets.sample_profile;
  const storyBg = media_url
    ? `url(${media_url})`
    : "linear-gradient(135deg, #a78bfa, #4f46e5)";

  return (
    <div
      className="flex-shrink-0 w-24 h-40 rounded-xl overflow-hidden shadow-md cursor-pointer 
                 relative p-1 border-2 border-transparent hover:border-indigo-400 transition-colors"
      style={{
        backgroundImage: storyBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
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
          <span className="absolute bottom-1 left-1 right-1 text-white text-[10px] truncate drop-shadow">
            3 months ago
          </span>
        </>
      )}
    </div>
  );
};

// -----------------------------------------------------------------
// 2. Post Card
// -----------------------------------------------------------------
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
  return (
    <div className="bg-gray-50 min-h-screen ">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 p-4">
        {/* Center: Stories & Posts */}
        <div className="col-span-full md:col-span-4 lg:col-span-8">
          {/* Stories */}
          <div className="mb-8 p-4 bg-white rounded-xl shadow-md border border-gray-100">
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <StoryCard isCurrentUser={true} />
              {dummyStoriesData.map((story) => (
                <StoryCard
                  key={story._id}
                  user={story.user}
                  media_url={story.media_url}
                />
              ))}
            </div>
          </div>

          {/* Posts */}
          <ListPosts/>
        
        </div>

       {/* Right Sidebar */}
        <div className="hidden md:block md:col-span-4 lg:col-span-4">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default Feed;
