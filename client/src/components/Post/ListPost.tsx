import React from 'react';
import { ThumbsUp, MessageCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion'; // Lưu ý: check lại thư viện motion/framer-motion
import { CommentModal } from './CommentModal';
import { Post } from '../types/post';

// Component hiển thị nhiều ảnh dạng Grid
// Dữ liệu mediaHashes bây giờ là URL đầy đủ (http://localhost:3000/uploads/...)
const ImageGrid = ({ mediaHashes }: { mediaHashes: string[] }) => {
  if (!mediaHashes || mediaHashes.length === 0) return null;

  const imageCount = mediaHashes.length;

  // 1 ảnh
  if (imageCount === 1) {
    return (
      <div className="w-full bg-gray-100">
        <img 
          src={mediaHashes[0]} 
          alt="Post media" 
          className="w-full h-auto object-contain max-h-[600px]"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 ảnh
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100">
        {mediaHashes.map((url, idx) => (
          <div key={idx} className="relative overflow-hidden" style={{ paddingBottom: '100%' }}>
            <img 
              src={url} 
              alt={`Media ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 ảnh
  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
        <div className="relative overflow-hidden">
          <img 
            src={mediaHashes[0]} 
            alt="Main media"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          <div className="relative overflow-hidden">
            <img 
              src={mediaHashes[1]} 
              alt="Media 2"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={mediaHashes[2]} 
              alt="Media 3"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4+ ảnh
  return (
    <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
      {mediaHashes.slice(0, 4).map((url, idx) => (
        <div key={idx} className="relative overflow-hidden">
          <img 
            src={url} 
            alt={`Media ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {idx === 3 && imageCount > 4 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-all">
              <span className="text-white text-3xl font-bold">
                +{imageCount - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

interface PostListProps {
  posts: Post[];
  loading: boolean;
  selectedPost: Post | null;
  commentText: string;
  // userAddress: string | undefined; // Không cần thiết nếu đã handle trong hook
  onLike: (postId: string) => void; // ID giờ là string
  onOpenComments: (post: Post) => void;
  onCloseComments: () => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
  isSubmittingComment?: boolean;
}

export const ListPost: React.FC<PostListProps> = ({
  posts,
  loading,
  selectedPost,
  commentText,
  onLike,
  onOpenComments,
  onCloseComments,
  onCommentChange,
  onAddComment,
  isSubmittingComment
}) => {
  if (loading) {
    return (
      <div className="min-h-[200px] bg-gray-50 flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Đang tải bảng tin...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
        <p className="text-gray-500">Chưa có bài viết nào. Hãy kết bạn hoặc tạo bài viết mới!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={post.avatar} 
                  alt={post.authorName} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {post.authorName}
                  </div>
                  <div className="text-gray-500 text-xs">{post.time}</div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="whitespace-pre-wrap text-gray-800 text-[15px]">{post.content}</p>
            </div>

            {/* Images */}
            <ImageGrid mediaHashes={post.mediaUrls} />

            {/* Stats */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-1">
                 {post.likes > 0 && (
                    <div className="bg-blue-500 p-1 rounded-full">
                        <ThumbsUp className="w-3 h-3 text-white fill-white" />
                    </div>
                 )}
                 <span className="text-gray-500 text-sm hover:underline cursor-pointer">{post.likes}</span>
              </div>
              <div className="text-gray-500 text-sm hover:underline cursor-pointer">
                {post.commentsCount} bình luận
              </div>
            </div>

            {/* Actions */}
            <div className="px-2 py-1 flex items-center justify-between">
              <motion.button
                onClick={() => onLike(post.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 transition-colors ${
                  post.isLiked ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <div className={`${post.isLiked ? 'animate-bounce' : ''}`}>
                   <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-blue-600' : ''}`} />
                </div>
                <span className="font-medium text-sm">Thích</span>
              </motion.button>
              
              <button
                onClick={() => onOpenComments(post)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium text-sm">Bình luận</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <CommentModal
          post={selectedPost}
          commentText={commentText}
          onClose={onCloseComments}
          onLike={onLike}
          onCommentChange={onCommentChange}
          onAddComment={onAddComment}
          isSubmitting={isSubmittingComment}
        />
      )}
    </>
  );
};