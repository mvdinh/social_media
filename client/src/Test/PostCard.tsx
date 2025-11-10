import { User, Clock, ImageIcon, Video } from 'lucide-react';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import CommentButton from './CommentButton';

interface Post {
  postId: number;
  id?: string;
  author: string;
  content?: string;
  media: string | null;
  mediaType: number;
  timestamp: number;
  blockchainId?: string;
  likes: number;
  shares: number;
  comments: number;
}

interface PostCardProps {
  post: Post;
  user: string;
  contract: any;
}

const PostCard = ({ post, user, contract }: PostCardProps) => {
  // Use postId consistently
  const postId = String(post.blockchainId);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
          {post.author.slice(2, 4).toUpperCase()}
        </div>
        
        <img src={`http://localhost:3000/ipfs/${post.content}`} alt="Post media" />


        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-sm text-gray-700 truncate">
              {formatAddress(post.author)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(post.timestamp)}</span>
          </div>
        </div>

        {/* Media type indicator */}
        {post.media && (
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {post.mediaType === 1 ? (
              <>
                <ImageIcon className="w-3 h-3" />
                <span>Image</span>
              </>
            ) : post.mediaType === 2 ? (
              <>
                <Video className="w-3 h-3" />
                <span>Video</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800">{post.content}</p>
        </div>
      )}

      {/* Media content */}
      {post.media && (
        <div className="relative bg-gray-100">
          {post.mediaType === 1 ? (
            <img 
              src={post.media} 
              alt="Post media"
              className="w-full max-h-[500px] object-contain"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : post.mediaType === 2 ? (
            <video 
              src={post.media}
              controls
              className="w-full max-h-[500px]"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>
      )}

      {/* Footer with actions */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-6">
          <LikeButton 
            postId={postId}
            likesCount={post.likes}
          />
          
          <CommentButton 
            postId={postId}
            user={user}
            contract={contract}
            commentsCount={post.comments}
          />
          
          <ShareButton 
            postId={postId}
            user={user}
            contract={contract}
            sharesCount={post.shares}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCard;