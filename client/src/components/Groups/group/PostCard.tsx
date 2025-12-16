import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Globe } from 'lucide-react';

interface Post {
  id: number;
  author: {
    name: string;
    avatar: string;
    timestamp: string;
    isPublic: boolean;
  };
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  shares: number;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p>{post.author.name}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <span>{post.author.timestamp}</span>
                  <span>·</span>
                  {post.author.isPublic && <Globe className="w-3 h-3" />}
                </div>
              </div>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-3">
          <p className="whitespace-pre-line text-gray-900">{post.content}</p>
        </div>
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : ''}`}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              className="w-full object-cover"
            />
          ))}
        </div>
      )}

      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <ThumbsUp className="w-3 h-3 text-white fill-white" />
            </div>
            <span>{post.likes}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{post.comments} bình luận</span>
            {post.shares > 0 && <span>{post.shares} lượt chia sẻ</span>}
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2">
          <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <ThumbsUp className="w-5 h-5" />
            <span>Thích</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>Bình luận</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <Share2 className="w-5 h-5" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Comment Input Preview */}
      <div className="px-4 pb-3 border-t border-gray-200 pt-3">
        <div className="text-sm text-gray-500 cursor-pointer hover:underline">
          Xem thêm bình luận
        </div>
      </div>
    </div>
  );
}