import { useState } from 'react';
import { MoreHorizontal, Share2, Globe, ThumbsUp, MessageCircle } from 'lucide-react';

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge?: string;
  };
  timestamp: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard = ({ post, onLike, onComment, onShare, onDelete }: PostCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.(post.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex gap-3 flex-1">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 hover:underline cursor-pointer truncate">
                {post.author.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {post.author.badge && (
                <>
                  <span className="truncate">{post.author.badge}</span>
                  <span>•</span>
                </>
              )}
              <span>{post.timestamp}</span>
              <span>•</span>
              <Globe size={12} className="flex-shrink-0" />
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal size={20} className="text-gray-600" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 min-w-[200px]">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-700">
                  Lưu bài viết
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-700">
                  Ẩn bài viết
                </button>
                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-gray-700">
                  Báo cáo bài viết
                </button>
                {onDelete && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                    >
                      Xóa bài viết
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="whitespace-pre-line text-gray-900 leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="pb-3">
          <div className={`grid gap-1 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            post.images.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {post.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Post content ${index + 1}`}
                  className={`w-full object-cover cursor-pointer hover:opacity-95 transition-opacity ${
                    post.images!.length === 1 ? 'max-h-[500px] rounded-none' :
                    post.images!.length <= 3 ? 'h-64' :
                    'h-48'
                  }`}
                />
                {/* Show +N overlay on 4th image if more than 4 images */}
                {index === 3 && post.images!.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors">
                    <span className="text-white text-3xl font-semibold">
                      +{post.images!.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2.5 flex items-center justify-between text-sm border-t border-gray-200">
        <div className="flex items-center gap-2">
          {likesCount > 0 && (
            <>
              <div className="flex -space-x-1">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-xs border-2 border-white">
                  👍
                </div>
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs border-2 border-white">
                  ❤️
                </div>
                <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs border-2 border-white">
                  😆
                </div>
              </div>
              <span className="text-gray-600 hover:underline cursor-pointer">
                {likesCount}
              </span>
            </>
          )}
        </div>
        <div className="flex gap-4 text-gray-600">
          {post.comments > 0 && (
            <button className="hover:underline">
              {post.comments} bình luận
            </button>
          )}
          {post.shares > 0 && (
            <button className="hover:underline">
              {post.shares} lượt chia sẻ
            </button>
          )}
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-2 py-1 border-t border-gray-200 flex gap-1">
        <button
          onClick={handleLike}
          className={`flex-1 py-2.5 flex items-center justify-center gap-2 rounded-md transition-all ${
            isLiked
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp
            size={18}
            className={isLiked ? 'fill-current' : ''}
          />
          <span className="font-medium">
            {isLiked ? 'Đã thích' : 'Thích'}
          </span>
        </button>
        <button
          onClick={() => onComment?.(post.id)}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
        >
          <MessageCircle size={18} />
          <span className="font-medium">Bình luận</span>
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className="flex-1 py-2.5 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
        >
          <Share2 size={18} />
          <span className="font-medium">Chia sẻ</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;