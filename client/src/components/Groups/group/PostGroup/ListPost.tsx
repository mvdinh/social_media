import React from 'react';
import { ThumbsUp, MessageCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CommentModal } from './CommentModal';
import { Post } from '../../type/post';

const IPFS_GATEWAY = "http://127.0.0.1:8080/ipfs/";

// Component hiển thị nhiều ảnh dạng Grid
const ImageGrid = ({ mediaHashes }: { mediaHashes: string[] }) => {
  if (!mediaHashes || mediaHashes.length === 0) return null;

  const imageCount = mediaHashes.length;

  // 1 ảnh: full width với tỷ lệ tự nhiên
  if (imageCount === 1) {
    return (
      <div className="w-full bg-gray-100">
        <img 
          src={`${IPFS_GATEWAY}${mediaHashes[0]}`} 
          alt="Post media" 
          className="w-full h-auto object-contain max-h-[600px]"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 ảnh: 2 cột với chiều cao cố định
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100">
        {mediaHashes.map((hash, idx) => (
          <div key={idx} className="relative overflow-hidden" style={{ paddingBottom: '100%' }}>
            <img 
              src={`${IPFS_GATEWAY}${hash}`} 
              alt={`Media ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải
  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
        <div className="relative overflow-hidden">
          <img 
            src={`${IPFS_GATEWAY}${mediaHashes[0]}`} 
            alt="Main media"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          <div className="relative overflow-hidden">
            <img 
              src={`${IPFS_GATEWAY}${mediaHashes[1]}`} 
              alt="Media 2"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={`${IPFS_GATEWAY}${mediaHashes[2]}`} 
              alt="Media 3"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4+ ảnh: Grid 2x2, với badge hiển thị số ảnh còn lại
  return (
    <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
      {mediaHashes.slice(0, 4).map((hash, idx) => (
        <div key={idx} className="relative overflow-hidden">
          <img 
            src={`${IPFS_GATEWAY}${hash}`} 
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
  userAddress: string | undefined;
  onLike: (postId: number) => void;
  onOpenComments: (post: Post) => void;
  onCloseComments: () => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
}

export const ListPost: React.FC<PostListProps> = ({
  posts,
  loading,
  selectedPost,
  commentText,
  userAddress,
  onLike,
  onOpenComments,
  onCloseComments,
  onCommentChange,
  onAddComment
}) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover"/>
                <div>
                  <div className="font-semibold text-sm">
                    {post.author.slice(0, 6)}...{post.author.slice(-4)}
                  </div>
                  <div className="text-gray-500 text-sm">{post.time}</div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Images */}
            <ImageGrid mediaHashes={post.mediaHashes} />

            {/* Stats */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200">
              <div className="text-gray-600 text-sm">{post.likes} lượt thích</div>
              <div className="text-gray-600 text-sm">{post.comments.length} bình luận</div>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex items-center justify-around">
              <motion.button
                onClick={() => onLike(post.id)}
                whileTap={{ scale: 0.9 }}
                disabled={!userAddress}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  post.isLiked ? 'text-blue-600' : 'text-gray-600'
                } ${!userAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <motion.div
                  animate={post.isLiked ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                </motion.div>
                <span>Thích</span>
              </motion.button>
              <button
                onClick={() => onOpenComments(post)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Bình luận</span>
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
          userAddress={userAddress}
        />
      )}
    </>
  );
};