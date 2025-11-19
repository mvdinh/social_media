import React from 'react';
import { ThumbsUp, MessageCircle, X, Send, Smile, Image as ImageIcon } from 'lucide-react';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

interface CommentModalProps {
  post: Post;
  commentText: string;
  onClose: () => void;
  onLike: (postId: number) => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
}

export function CommentModal({ 
  post, 
  commentText, 
  onClose, 
  onLike, 
  onCommentChange, 
  onAddComment 
}: CommentModalProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddComment();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2>Bài viết của {post.author}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Post Content in Modal */}
          {post.image && (
            <div className="w-full">
              <img
                src={post.image}
                alt="Post"
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          {/* Post Stats in Modal */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gray-600">{post.likes} lượt thích</span>
              <span className="text-gray-600 ml-auto">
                {post.comments.length} bình luận
              </span>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex items-center justify-around border-t border-gray-200 pt-2">
              <button
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  post.isLiked ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>Thích</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>Bình luận</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <select className="text-gray-600 border-none outline-none cursor-pointer">
                <option>Phù hợp nhất</option>
                <option>Mới nhất</option>
                <option>Tất cả bình luận</option>
              </select>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                </div>
              ) : (
                post.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-2xl px-4 py-2 inline-block">
                        <div className="text-sm mb-1">{comment.author}</div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 px-2">
                        <button className="text-xs text-gray-600 hover:underline">
                          Thích
                        </button>
                        <button className="text-xs text-gray-600 hover:underline">
                          Trả lời
                        </button>
                        <span className="text-xs text-gray-500">{comment.time}</span>
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
          <div className="flex items-center gap-3">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-gray-200 rounded-full">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-200 rounded-full">
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <button
              onClick={onAddComment}
              disabled={!commentText.trim()}
              className={`p-2 rounded-full transition-colors ${
                commentText.trim()
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
