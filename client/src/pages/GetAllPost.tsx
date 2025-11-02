import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Image as ImageIcon, Video, Clock, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Post {
  id: string;
  author: string;
  media: string | null;
  mediaType: number;
  timestamp: number;
}

const GetAllPost= () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/getAllPost`, {
        timeout: 10000
      });

      console.log('📥 Fetched posts:', response.data);
      setPosts(response.data);
    } catch (err: any) {
      console.error('❌ Error fetching posts:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNREFUSED') {
          setError('Cannot connect to server. Please make sure backend is running.');
        } else if (err.response) {
          setError(`Server error: ${err.response.data?.error || err.response.statusText}`);
        } else {
          setError('Network error. Please check your connection.');
        }
      } else {
        setError('Failed to load posts');
      }
    } finally {
      setLoading(false);
    }
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
        <div className="text-red-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load posts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-3">
          <ImageIcon className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
        <p className="text-gray-600">Be the first to create a post!</p>
      </div>
    );
  }

  // Posts display
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div 
          key={post.id} 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Header */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
              {post.author.slice(2, 4).toUpperCase()}
            </div>
            
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
            <div>{post.content}</div>
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

          {/* Media content */}
          {post.media && (
            <div className="relative bg-gray-100">
              {post.mediaType === 1 ? (
                // Image
                <img 
                  src={post.media} 
                  alt="Post media"
                  className="w-full max-h-[500px] object-contain"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback if image fails to load
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : post.mediaType === 2 ? (
                // Video
                <video 
                  src={post.media}
                  controls
                  className="w-full max-h-[500px]"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                // Text-only post (no media)
                <div className="p-8 text-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Text-only post</p>
                </div>
              )}
            </div>
          )}

          {/* Footer with actions (placeholder for future features) */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <button className="hover:text-blue-500 transition-colors">
                Like
              </button>
              <button className="hover:text-blue-500 transition-colors">
                Comment
              </button>
              <button className="hover:text-blue-500 transition-colors">
                Share
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Load more button (for future pagination) */}
      <div className="text-center pt-4">
        <button
          onClick={fetchPosts}
          className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
        >
          Refresh Posts
        </button>
      </div>
    </div>
  );
};

export default GetAllPost;