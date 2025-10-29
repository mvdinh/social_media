import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface Post {
  id: number;
  author: string;
  contentCID: string;
  timestamp: bigint;
  likes: number;
}

interface PostItemProps {
  post: Post;
  onUpdate?: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onUpdate }) => {
  const { account, contract, executeGaslessTransaction } = useWallet();
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shareText, setShareText] = useState('');
  const [showShareBox, setShowShareBox] = useState(false);

  useEffect(() => {
    checkLikeStatus();
  }, [post.id, account]);

  const checkLikeStatus = async () => {
    if (!contract || !account) return;
    try {
      const liked = await contract.hasLiked(post.id, account);
      setHasLiked(liked);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!contract || isLiking) return;

    try {
      setIsLiking(true);
      
      const result = await executeGaslessTransaction(
        hasLiked ? contract.unlikePost(post.id) : contract.likePost(post.id),
        hasLiked ? 'Đã bỏ thích' : 'Đã thích bài viết'
      );

      if (result.success) {
        setHasLiked(!hasLiked);
        setLikes(prev => hasLiked ? prev - 1 : prev + 1);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async () => {
    if (!contract || isCommenting || !commentText.trim()) return;

    try {
      setIsCommenting(true);
      
      const commentCID = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const result = await executeGaslessTransaction(
        contract.commentPost(post.id, commentCID),
        '✅ Comment thành công! (Không mất ETH)'
      );

      if (result.success) {
        setCommentText('');
        setShowCommentBox(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error commenting:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    if (!contract || isSharing) return;

    try {
      setIsSharing(true);
      
      const shareCID = shareText.trim() 
        ? `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : `share_${post.id}_${Date.now()}`;
      
      const result = await executeGaslessTransaction(
        contract.sharePost(post.id, shareCID),
        '✅ Share thành công! (Không mất ETH)'
      );

      if (result.success) {
        setShareText('');
        setShowShareBox(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.author.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-mono font-semibold text-gray-800">
              {post.author.slice(0, 6)}...{post.author.slice(-4)}
            </p>
            <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 text-gray-700 leading-relaxed">
        {post.contentCID}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            hasLiked 
              ? 'text-red-500 bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:bg-gray-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {hasLiked ? '❤️' : '🤍'}
          <span className="font-semibold">{likes}</span>
        </button>

        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          💬 Comment
        </button>

        <button
          onClick={() => setShowShareBox(!showShareBox)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          🔄 Share
        </button>
      </div>

      {/* Comment Box */}
      {showCommentBox && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Viết comment của bạn..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setShowCommentBox(false);
                setCommentText('');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleComment}
              disabled={isCommenting || !commentText.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCommenting ? 'Đang gửi...' : 'Comment (Free)'}
            </button>
          </div>
        </div>
      )}

      {/* Share Box */}
      {showShareBox && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <textarea
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            placeholder="Thêm suy nghĩ của bạn khi share... (tùy chọn)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setShowShareBox(false);
                setShareText('');
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? 'Đang share...' : 'Share (Free)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;