import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, Loader2, Clock, User, MessageCircle, Share2, RefreshCw, ImageIcon, Video } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Post {
  id: string;
  author: string;
  content?: string;
  media: string | null;
  mediaType: number;
  timestamp: number;
  blockchainId?: string;
}

interface LikeStatus {
  [postId: string]: {
    isLiked: boolean;
    count: number;
    loading: boolean;
  };
}

const GetAllPost = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likeStatus, setLikeStatus] = useState<LikeStatus>({});
  const [currentUser, setCurrentUser] = useState<string>('');

  // Test panel state
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testPostId, setTestPostId] = useState('');
  const [testUser, setTestUser] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
    // Load current user from localStorage or generate random
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
    } else {
      const randomUser = `0x${Math.random().toString(16).substr(2, 40)}`;
      setCurrentUser(randomUser);
      localStorage.setItem('currentUser', randomUser);
    }
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
      
      // Fetch like status for each post
      response.data.forEach((post: Post) => {
        fetchLikeStatus(post.id || post.blockchainId || post.id);
      });
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

  const fetchLikeStatus = async (postId: string) => {
    try {
      // Get total likes
      const likesResponse = await axios.get(`${API_URL}/likes/${postId}`);
      const count = likesResponse.data.data?.count || 0;

      // Check if current user liked
      const checkResponse = await axios.get(`${API_URL}/likes/check/${postId}/${currentUser}`);
      const isLiked = checkResponse.data.data?.isLiked || false;

      setLikeStatus(prev => ({
        ...prev,
        [postId]: { isLiked, count, loading: false }
      }));
    } catch (err) {
      console.error('Error fetching like status:', err);
      setLikeStatus(prev => ({
        ...prev,
        [postId]: { isLiked: false, count: 0, loading: false }
      }));
    }
  };

  const handleLike = async (postId: string) => {
    const status = likeStatus[postId];
    if (!status || status.loading) return;

    setLikeStatus(prev => ({
      ...prev,
      [postId]: { ...prev[postId], loading: true }
    }));

    try {
      if (status.isLiked) {
        // Unlike
        const response = await axios.delete(`${API_URL}/likes`, {
          data: { postId, user: currentUser }
        });
        
        console.log('✅ Unlike success:', response.data);
        
        setLikeStatus(prev => ({
          ...prev,
          [postId]: {
            isLiked: false,
            count: Math.max(0, prev[postId].count - 1),
            loading: false
          }
        }));
      } else {
        // Like
        const response = await axios.post(`${API_URL}/likes`, {
          postId,
          user: currentUser
        });
        
        console.log('✅ Like success:', response.data);
        
        setLikeStatus(prev => ({
          ...prev,
          [postId]: {
            isLiked: true,
            count: prev[postId].count + 1,
            loading: false
          }
        }));
      }
    } catch (err: any) {
      console.error('❌ Error toggling like:', err);
      setLikeStatus(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loading: false }
      }));
      
      alert(err.response?.data?.message || 'Failed to toggle like');
    }
  };

  // Test API functions
  const testLikeAPI = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await axios.post(`${API_URL}/likes`, {
        postId: testPostId,
        user: testUser || currentUser
      });
      setTestResult({ success: true, data: response.data });
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const testUnlikeAPI = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await axios.delete(`${API_URL}/likes`, {
        data: { postId: testPostId, user: testUser || currentUser }
      });
      setTestResult({ success: true, data: response.data });
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const testGetLikes = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await axios.get(`${API_URL}/likes/${testPostId}`);
      setTestResult({ success: true, data: response.data });
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const testCheckLike = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await axios.get(`${API_URL}/likes/check/${testPostId}/${testUser || currentUser}`);
      setTestResult({ success: true, data: response.data });
    } catch (err: any) {
      setTestResult({ success: false, error: err.response?.data || err.message });
    } finally {
      setTestLoading(false);
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
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading posts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Current User Info */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current User</p>
            <p className="font-mono text-xs">{formatAddress(currentUser)}</p>
          </div>
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {showTestPanel ? 'Hide' : 'Show'} Test Panel
          </button>
        </div>
      </div>

      {/* Test Panel */}
      {showTestPanel && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🧪 API Test Panel</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post ID</label>
              <input
                type="text"
                value={testPostId}
                onChange={(e) => setTestPostId(e.target.value)}
                placeholder="Enter post ID (e.g., 0, 1, 2)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Address (optional)</label>
              <input
                type="text"
                value={testUser}
                onChange={(e) => setTestUser(e.target.value)}
                placeholder={`Default: ${formatAddress(currentUser)}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={testLikeAPI}
                disabled={testLoading || !testPostId}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Like'}
              </button>
              
              <button
                onClick={testUnlikeAPI}
                disabled={testLoading || !testPostId}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Unlike'}
              </button>

              <button
                onClick={testGetLikes}
                disabled={testLoading || !testPostId}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Get Likes'}
              </button>

              <button
                onClick={testCheckLike}
                disabled={testLoading || !testPostId}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {testLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Check Like'}
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? '✅ Success' : '❌ Error'}
                </p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-3">
            <ImageIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
          <p className="text-gray-600">Be the first to create a post!</p>
        </div>
      )}

      {/* Posts display */}
      {posts.map((post) => {
        const postId = post.blockchainId;
        const status = likeStatus[postId] || { isLiked: false, count: 0, loading: false };

        return (
          <div 
            key={postId} 
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
                <button 
                  onClick={() => handleLike(postId)}
                  disabled={status.loading}
                  className={`flex items-center gap-2 transition-colors ${
                    status.isLiked 
                      ? 'text-red-500' 
                      : 'text-gray-500 hover:text-red-500'
                  } disabled:opacity-50`}
                >
                  {status.loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Heart className={`w-5 h-5 ${status.isLiked ? 'fill-current' : ''}`} />
                  )}
                  <span className="text-sm font-medium">
                    {status.count > 0 ? status.count : 'Like'}
                  </span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Comment</span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Refresh button */}
      <div className="text-center pt-4">
        <button
          onClick={fetchPosts}
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Posts
        </button>
      </div>
    </div>
  );
};

export default GetAllPost;