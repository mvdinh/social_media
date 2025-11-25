import React from 'react';
import { ThumbsUp, MessageCircle, X, Send, Smile } from 'lucide-react';
// Import type từ ListPost để đảm bảo đồng bộ
import { Post } from './ListPost';

interface CommentModalProps {
  post: Post;
  commentText: string;
  onClose: () => void;
  onLike: (postId: number) => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
  userAddress?: string;
}

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// Component hiển thị nhiều ảnh trong Modal
const ModalImageGrid = ({ mediaHashes }: { mediaHashes: string[] }) => {
  if (!mediaHashes || mediaHashes.length === 0) return null;

  const imageCount = mediaHashes.length;

  // 1 ảnh: full width với tỷ lệ tự nhiên
  if (imageCount === 1) {
    return (
      <div className="w-full mt-2 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={`${IPFS_GATEWAY}${mediaHashes[0]}`}
          alt="Post media"
          className="w-full h-auto object-contain max-h-[500px]"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 ảnh: 2 cột với chiều cao cố định
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 mt-2 rounded-lg overflow-hidden bg-gray-100">
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
      <div className="grid grid-cols-2 gap-1 mt-2 rounded-lg overflow-hidden bg-gray-100" style={{ height: '350px' }}>
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
    <div className="grid grid-cols-2 gap-1 mt-2 rounded-lg overflow-hidden bg-gray-100" style={{ height: '350px' }}>
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

export function CommentModal({ 
  post, 
  commentText, 
  onClose, 
  onLike, 
  onCommentChange, 
  onAddComment,
  userAddress
}: CommentModalProps) {
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddComment();
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(timestamp * 1000).toLocaleDateString('vi-VN');
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            Bài viết của {post.author.slice(0, 6)}...{post.author.slice(-4)}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Post Content */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <img
                src={post.avatar}
                alt={post.author}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {post.author.slice(0, 6)}...{post.author.slice(-4)}
                </div>
                <div className="text-gray-500 text-xs">{post.time}</div>
              </div>
            </div>
            <p className="whitespace-pre-wrap mb-3 text-gray-800">{post.content}</p>
            
            {/* Sử dụng ModalImageGrid component để hiển thị nhiều ảnh */}
            <ModalImageGrid mediaHashes={post.mediaHashes} />
          </div>

          {/* Post Stats & Action inside Modal */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 text-sm font-medium">{post.likes} lượt thích</span>
              <span className="text-gray-600 text-sm font-medium">{post.comments.length} bình luận</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onLike(post.id)}
                disabled={!userAddress}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white transition-colors ${
                  post.isLiked ? 'text-blue-600 font-medium' : 'text-gray-600'
                } ${!userAddress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>Thích</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white text-gray-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>Bình luận</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                  Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                </div>
              ) : (
                post.comments.map((comment, index) => (
                  <div key={index} className="flex gap-3 animate-in fade-in duration-300">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block">
                        <div className="font-semibold text-sm mb-1 text-gray-900">
                          {comment.author.slice(0, 6)}...{comment.author.slice(-4)}
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-gray-800">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Comment Input - Fixed at Bottom */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          {!userAddress ? (
            <div className="text-center py-3 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Vui lòng kết nối ví để bình luận
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userAddress}`}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
              />
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border focus-within:border-blue-400 focus-within:bg-white transition-all">
                <input
                  type="text"
                  placeholder="Viết bình luận..."
                  value={commentText}
                  onChange={(e) => onCommentChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-transparent outline-none text-sm py-1"
                  autoFocus
                />
                <button className="p-1 hover:bg-gray-200 rounded-full transition">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <button
                onClick={onAddComment}
                disabled={!commentText.trim()}
                className={`p-2 rounded-full transition-all duration-200 ${
                  commentText.trim()
                    ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-md'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}