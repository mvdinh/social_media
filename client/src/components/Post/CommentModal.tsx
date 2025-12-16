import React from 'react';
import { ThumbsUp, MessageCircle, X, Send, Smile, Loader2 } from 'lucide-react';
import { Post } from '../types/post';
import { getTimeAgo } from '../utils/getTimeAgo';

interface CommentModalProps {
  post: Post;
  commentText: string;
  onClose: () => void;
  onLike: (postId: string) => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
  isSubmitting?: boolean;
}

// Reuse logic ModalImageGrid (copy logic từ ListPost hoặc tách ra component riêng)
// Ở đây giả sử ModalImageGrid nhận URL trực tiếp
const ModalImageGrid = ({ mediaHashes }: { mediaHashes: string[] }) => {
    if (!mediaHashes || mediaHashes.length === 0) return null;
    // ... Logic render giống ListPost, chỉ khác style (size ảnh) ...
    // Code rút gọn cho ví dụ:
    return (
        <div className="mt-2 grid gap-1">
            {mediaHashes.map((url, idx) => (
                <img key={idx} src={url} alt="media" className="w-full rounded-lg object-contain bg-gray-100 max-h-[500px]" />
            ))}
        </div>
    )
};

export function CommentModal({ 
  post, 
  commentText, 
  onClose, 
  onLike, 
  onCommentChange, 
  onAddComment,
  isSubmitting
}: CommentModalProps) {
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddComment();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex shadow-2xl overflow-hidden">
        
        {/* LEFT: MEDIA & CONTENT (Scrollable on mobile, fixed on desktop) */}
        <div className="flex-1 overflow-y-auto bg-gray-50 border-r border-gray-200">
             <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <img src={post.avatar} alt={post.authorName} className="w-10 h-10 rounded-full border border-gray-200"/>
                    <div>
                        <div className="font-semibold text-sm">{post.authorName}</div>
                        <div className="text-gray-500 text-xs">{post.time}</div>
                    </div>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>
                <ModalImageGrid mediaHashes={post.mediaUrls} />
             </div>
        </div>

        {/* RIGHT: COMMENTS & ACTIONS (Fixed width) */}
        <div className="w-[350px] md:w-[400px] flex flex-col bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Bình luận</h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Comment List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, index) => (
                        <div key={index} className="flex gap-2">
                            <img src={comment.avatar} alt="avt" className="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0" />
                            <div>
                                <div className="bg-gray-100 rounded-2xl px-3 py-2">
                                    <span className="font-semibold text-sm block">
                                       {post.authorName.length > 15
                                        ? post.authorName.slice(0, 15) + "..."
                                        : post.authorName}
                                    </span>
                                    <span className="text-sm text-gray-800">{comment.content}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 ml-2">{comment.time}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 mt-10">
                        Chưa có bình luận nào.
                    </div>
                )}
            </div>

            {/* Footer: Actions & Input */}
            <div className="border-t border-gray-200 p-4">
                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-500 mb-3 px-1">
                    <span>{post.likes} lượt thích</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex border-t border-b border-gray-100 py-1 mb-3">
                    <button 
                        onClick={() => onLike(post.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-50 ${post.isLiked ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    >
                        <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-blue-600' : ''}`} />
                        Like
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-50 text-gray-600">
                        <MessageCircle className="w-5 h-5" />
                        Comment
                    </button>
                </div>

                {/* Input */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                        <input 
                            type="text" 
                            value={commentText}
                            onChange={(e) => onCommentChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Viết bình luận..." 
                            className="bg-transparent w-full outline-none text-sm"
                            autoFocus
                        />
                        <Smile className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                    <button 
                        onClick={onAddComment}
                        disabled={!commentText.trim() || isSubmitting}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}