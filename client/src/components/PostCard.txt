import React from 'react'

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


export default PostCard
