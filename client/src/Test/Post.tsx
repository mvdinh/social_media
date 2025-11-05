import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Heart, MessageCircle, Share2, Send, Image as ImageIcon, 
  Video, Loader2, Clock, User, RefreshCw, X 
} from 'lucide-react';
import { ethers } from 'ethers';

// ============ TYPES ============
interface Post {
  id: string;
  author: string;
  content?: string;
  media: string | null;
  mediaType: number;
  timestamp: number;
  blockchainId: string;
}

interface Comment {
  _id: string;
  postId: number;
  commentIndex: number;
  author: string;
  contentHash: string;
  mediaHash?: string;
  timestamp: string;
  txHash: string;
}

interface LikeStatus {
  isLiked: boolean;
  count: number;
  loading: boolean;
}

// ============ API SERVICE ============
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

class ApiService {
  // Posts
  static async getAllPosts() {
    const response = await axios.get(`${API_URL}/getAllPost`, { timeout: 10000 });
    return response.data;
  }

  // Likes
  static async likePost(postId: string, user: string) {
    const response = await axios.post(`${API_URL}/likes`, { postId, user });
    return response.data;
  }

  static async unlikePost(postId: string, user: string) {
    const response = await axios.delete(`${API_URL}/likes`, { 
      data: { postId, user } 
    });
    return response.data;
  }

  static async getLikes(postId: string) {
    const response = await axios.get(`${API_URL}/likes/${postId}`);
    return response.data;
  }

  static async checkLike(postId: string, user: string) {
    const response = await axios.get(`${API_URL}/likes/check/${postId}/${user}`);
    return response.data;
  }

  // Comments
  static async addComment(data: {
    postId: number;
    author: string;
    content: string;
    txHash: string;
  }) {
    const response = await axios.post(`${API_URL}/comments`, data);
    return response.data;
  }

  static async getComments(postId: number) {
    const response = await axios.get(`${API_URL}/comments/${postId}`);
    return response.data;
  }
}

// ============ UTILS ============
const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatTimestamp = (timestamp: number | string) => {
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

// ============ COMPONENTS ============

// Comment Item Component
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="flex gap-3 py-3 border-t border-gray-100 first:border-0">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
      {comment.author.slice(2, 4).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-900">
          {formatAddress(comment.author)}
        </span>
        <span className="text-xs text-gray-400">
          {formatTimestamp(comment.timestamp)}
        </span>
      </div>
      <p className="text-sm text-gray-700 break-words">{comment.contentHash}</p>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <span className="font-mono">TX: {formatAddress(comment.txHash)}</span>
      </div>
    </div>
  </div>
);

// Add Comment Form Component
const AddCommentForm: React.FC<{
  postId: string;
  currentUser: string;
  provider: ethers.BrowserProvider | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ postId, currentUser, provider, onSuccess, onCancel }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'signing' | 'success' | 'error'>('input');
  const [txHash, setTxHash] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || !provider) return;

    setLoading(true);
    setStep('signing');

    try {
      // 1. Lấy signer từ provider
      const signer = await provider.getSigner();
      
      // 2. Tạo message để ký
      const message = `Comment on post ${postId}: ${content}`;
      const timestamp = Date.now();
      
      // 3. Ký message với MetaMask
      const signature = await signer.signMessage(message);
      
      // 4. Tạo transaction hash từ signature (trong thực tế có thể dùng chính signature hoặc tạo hash)
      const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature + timestamp));
      
      setTxHash(txHash);

      // 5. Gửi comment lên backend (backend sẽ xử lý logic blockchain)
      await ApiService.addComment({
        postId: Number(postId),
        author: currentUser,
        content: content,
        txHash: txHash
      });

      setStep('success');
      
      // Đợi một chút rồi reset form
      setTimeout(() => {
        setContent('');
        setStep('input');
        onSuccess();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      if (error.code === 4001) {
        // User rejected the signature request
        setStep('error');
      } else {
        setStep('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment..."
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading || !provider}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
                Sign & Comment
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
            {!provider && (
              <p className="text-xs text-red-500 text-center">
                Wallet not connected. Please connect your wallet first.
              </p>
            )}
          </>
        );
      
      case 'signing':
        return (
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Waiting for Signature...
            </p>
            <p className="text-xs text-gray-500">
              Please check your MetaMask wallet to sign the message
            </p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Comment Added Successfully!
            </p>
            <p className="text-xs text-gray-500 font-mono">
              TX: {formatAddress(txHash)}
            </p>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Signature Failed
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Please try again
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep('input')}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="space-y-3">
        {getStepContent()}
      </div>
    </div>
  );
};

// Comments Section Component
const CommentsSection: React.FC<{
  postId: string;
  currentUser: string;
  provider: ethers.BrowserProvider | null;
  onUpdate: () => void;
}> = ({ postId, currentUser, provider, onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getComments(Number(postId));
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setLoading(false);
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    loadComments();
    onUpdate();
  };

  return (
    <div>
      {/* Comments Header */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={loading || !provider}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            {showAddForm ? 'Cancel' : 'Add Comment'}
          </button>
        </div>
      </div>

      {/* Add Comment Form */}
      {showAddForm && (
        <AddCommentForm
          postId={postId}
          currentUser={currentUser}
          provider={provider}
          onSuccess={handleSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Comments List */}
      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="px-4 pb-4">
          {comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

// Like Button Component (giữ nguyên)
const LikeButton: React.FC<{
  postId: string;
  currentUser: string;
  onUpdate: () => void;
}> = ({ postId, currentUser, onUpdate }) => {
  const [status, setStatus] = useState<LikeStatus>({
    isLiked: false,
    count: 0,
    loading: true
  });

  useEffect(() => {
    loadLikeStatus();
  }, [postId, currentUser]);

  const loadLikeStatus = async () => {
    try {
      const [likesData, checkData] = await Promise.all([
        ApiService.getLikes(postId),
        ApiService.checkLike(postId, currentUser)
      ]);

      setStatus({
        count: likesData.data?.count || 0,
        isLiked: checkData.data?.isLiked || false,
        loading: false
      });
    } catch (error) {
      console.error('Error loading like status:', error);
      setStatus({ isLiked: false, count: 0, loading: false });
    }
  };

  const handleToggle = async () => {
    if (status.loading) return;

    setStatus(prev => ({ ...prev, loading: true }));

    try {
      if (status.isLiked) {
        await ApiService.unlikePost(postId, currentUser);
        setStatus(prev => ({
          isLiked: false,
          count: Math.max(0, prev.count - 1),
          loading: false
        }));
      } else {
        await ApiService.likePost(postId, currentUser);
        setStatus(prev => ({
          isLiked: true,
          count: prev.count + 1,
          loading: false
        }));
      }
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle like');
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <button 
      onClick={handleToggle}
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
  );
};

// Post Card Component
const PostCard: React.FC<{
  post: Post;
  currentUser: string;
  provider: ethers.BrowserProvider | null;
  onUpdate: () => void;
}> = ({ post, currentUser, provider, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
          <LikeButton 
            postId={post.blockchainId} 
            currentUser={currentUser}
            onUpdate={onUpdate}
          />
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          
          <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post.blockchainId}
          currentUser={currentUser}
          provider={provider}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

// Main App Component
export default function BlockchainSocial() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    checkMetaMaskConnection();
    fetchPosts();
  }, []);

  // Kiểm tra xem user đã kết nối MetaMask trước đó chưa
  const checkMetaMaskConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setCurrentUser(accounts[0]);
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);
        }
      } catch (error) {
        console.error('Error checking MetaMask connection:', error);
      }
    }
  };

  // Kết nối với MetaMask
  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask to use this app.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Yêu cầu kết nối tài khoản
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        const userAddress = accounts[0];
        setCurrentUser(userAddress);
        
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        // Lưu thông tin kết nối
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('userAddress', userAddress);
      }

      // Lắng nghe sự thay đổi tài khoản
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setCurrentUser(accounts[0]);
          localStorage.setItem('userAddress', accounts[0]);
        } else {
          // User đã ngắt kết nối
          setCurrentUser('');
          setProvider(null);
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('userAddress');
        }
      });

      // Lắng nghe sự thay đổi chain
      window.ethereum.on('chainChanged', (chainId: string) => {
        // Reload page khi chain thay đổi
        window.location.reload();
      });

    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      
      if (error.code === 4001) {
        setError('Please connect to MetaMask to use this application.');
      } else {
        setError(`Connection failed: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Ngắt kết nối MetaMask
  const disconnectMetaMask = () => {
    setCurrentUser('');
    setProvider(null);
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('userAddress');
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getAllPosts();
      setPosts(data);
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

  // Thêm type cho window.ethereum
  declare global {
    interface Window {
      ethereum?: any;
    }
  }

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
  if (error && !currentUser) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="text-red-500 mb-3">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">MetaMask Required</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col gap-3">
            {error.includes('not installed') ? (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Install MetaMask
              </a>
            ) : (
              <button
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-semibold transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect MetaMask'
                )}
              </button>
            )}
            <button
              onClick={fetchPosts}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">
              🔗 Blockchain Social
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPosts}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
          
          {/* Wallet Connection Section */}
          <div className={`rounded-lg p-3 text-white transition-colors ${
            currentUser 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}>
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">Connected Wallet</p>
                  <p className="font-mono text-sm">{formatAddress(currentUser)}</p>
                </div>
                <button
                  onClick={disconnectMetaMask}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">Connect Your Wallet</p>
                  <p className="text-sm">Use MetaMask to interact with the blockchain</p>
                </div>
                <button
                  onClick={connectMetaMask}
                  disabled={isConnecting}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <img 
                        src="https://metamask.io/images/metamask-logo.png" 
                        alt="MetaMask" 
                        className="w-4 h-4"
                      />
                      Connect MetaMask
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error message khi đã kết nối nhưng có lỗi khác */}
          {error && currentUser && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <X className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        {!currentUser ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <img 
                src="https://metamask.io/images/metamask-logo.png" 
                alt="MetaMask" 
                className="w-8 h-8"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 mb-6">
              Please connect your MetaMask wallet to view and interact with posts on the blockchain.
            </p>
            <button
              onClick={connectMetaMask}
              disabled={isConnecting}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 rounded-full font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to MetaMask...
                </>
              ) : (
                <>
                  <img 
                    src="https://metamask.io/images/metamask-logo.png" 
                    alt="MetaMask" 
                    className="w-5 h-5"
                  />
                  Connect MetaMask
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Don't have MetaMask?{' '}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Download here
              </a>
            </p>
          </div>
        ) : (
          /* Posts Feed */
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
                <p className="text-gray-600">Be the first to create a post!</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.blockchainId}
                  post={post}
                  currentUser={currentUser}
                  provider={provider}
                  onUpdate={fetchPosts}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}