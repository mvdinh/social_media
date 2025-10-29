import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Heart, Share2, MessageCircle, Send, Loader, LogOut } from 'lucide-react';

// Import contract ABI và address (sau khi deploy)
import contractAddress from './config/contract-address.json';
import contractABI from './config/SocialMedia.json';

// Types
interface Post {
  id: number;
  author: string;
  content: string;
  likes: number;
  shares: number;
  timestamp: number;
  hasLiked: boolean;
  comments: Comment[];
  ipfsHash: string;
}

interface Comment {
  author: string;
  text: string;
  timestamp: number;
  ipfsHash: string;
}

interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  account: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const CONTRACT_ADDRESS = contractAddress.SocialMedia;

function App() {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    contract: null,
    account: ''
  });
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState('');

  // Connect Wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      // Create contract instance
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );

      setWeb3State({ provider, signer, contract, account });

      // Load posts after connecting
      await loadPosts(contract, account);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

    } catch (err: any) {
      console.error('Connect wallet error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWeb3State({
      provider: null,
      signer: null,
      contract: null,
      account: ''
    });
    setPosts([]);
    
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  // Handle account changes
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      window.location.reload();
    }
  };

  // Upload to IPFS via backend
  const uploadToIPFS = async (data: any): Promise<string> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ipfs/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data })
      });

      if (!response.ok) throw new Error('IPFS upload failed');

      const result = await response.json();
      return result.ipfsHash;
    } catch (err) {
      console.error('IPFS upload error:', err);
      throw err;
    }
  };

  // Get from IPFS via backend
  const getFromIPFS = async (cid: string): Promise<any> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ipfs/${cid}`);
      
      if (!response.ok) throw new Error('IPFS fetch failed');

      const result = await response.json();
      return result.content;
    } catch (err) {
      console.error('IPFS fetch error:', err);
      return null;
    }
  };

  // Create Post
  const createPost = async () => {
    if (!newPost.trim() || !web3State.contract) return;

    try {
      setLoading(true);
      setError('');

      // Upload content to IPFS
      const postData = {
        content: newPost,
        timestamp: Date.now(),
        author: web3State.account
      };

      const ipfsHash = await uploadToIPFS(postData);

      // Store hash on blockchain
      const tx = await web3State.contract.createPost(ipfsHash);
      await tx.wait();

      // Clear input
      setNewPost('');

      // Reload posts
      await loadPosts(web3State.contract, web3State.account);

    } catch (err: any) {
      console.error('Create post error:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Load Posts
  const loadPosts = async (contract: ethers.Contract, userAddr: string) => {
    try {
      const count = await contract.postCount();
      const loadedPosts: Post[] = [];

      // Load posts in reverse order (newest first)
      for (let i = Number(count); i >= Math.max(1, Number(count) - 20); i--) {
        try {
          const post = await contract.getPost(i);
          const ipfsData = await getFromIPFS(post.ipfsHash);
          const comments = await contract.getComments(i);
          const hasLiked = await contract.getUserLiked(i, userAddr);

          // Load comments from IPFS
          const loadedComments = await Promise.all(
            comments.map(async (c: any) => {
              const commentData = await getFromIPFS(c.ipfsHash);
              return {
                author: c.author,
                text: commentData?.text || '',
                timestamp: Number(c.timestamp) * 1000,
                ipfsHash: c.ipfsHash
              };
            })
          );

          loadedPosts.push({
            id: Number(post.id),
            author: post.author,
            content: ipfsData?.content || 'Loading...',
            likes: Number(post.likes),
            shares: Number(post.shares),
            timestamp: Number(post.timestamp) * 1000,
            hasLiked,
            comments: loadedComments,
            ipfsHash: post.ipfsHash
          });
        } catch (err) {
          console.error(`Error loading post ${i}:`, err);
        }
      }

      setPosts(loadedPosts);
    } catch (err) {
      console.error('Load posts error:', err);
    }
  };

  // Like/Unlike Post
  const toggleLike = async (postId: number, hasLiked: boolean) => {
    if (!web3State.contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = hasLiked 
        ? await web3State.contract.unlikePost(postId)
        : await web3State.contract.likePost(postId);
      
      await tx.wait();
      await loadPosts(web3State.contract, web3State.account);

    } catch (err: any) {
      console.error('Like error:', err);
      setError(err.message || 'Failed to like post');
    } finally {
      setLoading(false);
    }
  };

  // Share Post
  const sharePost = async (postId: number) => {
    if (!web3State.contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await web3State.contract.sharePost(postId);
      await tx.wait();
      await loadPosts(web3State.contract, web3State.account);

    } catch (err: any) {
      console.error('Share error:', err);
      setError(err.message || 'Failed to share post');
    } finally {
      setLoading(false);
    }
  };

  // Add Comment
  const addComment = async (postId: number) => {
    if (!web3State.contract || !comments[postId]?.trim()) return;

    try {
      setLoading(true);
      setError('');

      // Upload comment to IPFS
      const commentData = {
        text: comments[postId],
        timestamp: Date.now(),
        author: web3State.account
      };

      const ipfsHash = await uploadToIPFS(commentData);

      // Store on blockchain
      const tx = await web3State.contract.addComment(postId, ipfsHash);
      await tx.wait();

      // Clear input
      setComments({ ...comments, [postId]: '' });

      // Reload posts
      await loadPosts(web3State.contract, web3State.account);

    } catch (err: any) {
      console.error('Comment error:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Shorten address
  const shortAddr = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Helper: Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-black/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Web3 Social
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Decentralized • IPFS + Blockchain
            </p>
          </div>

          {!web3State.account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Wallet size={20} />
              )}
              <span className="hidden sm:inline">Connect Wallet</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur">
                  {shortAddr(web3State.account)}
                </div>
              </div>
              <button
                onClick={disconnectWallet}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Disconnect"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Create Post */}
        {web3State.account && (
          <div className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-6 border border-white/10">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts on-chain..."
              className="w-full bg-white/5 rounded-xl p-4 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 text-white placeholder-gray-400"
              rows={4}
              disabled={loading}
            />
            <button
              onClick={createPost}
              disabled={loading || !newPost.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-xl hover:opacity-90 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                'Post to Blockchain'
              )}
            </button>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-black/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10"
            >
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {shortAddr(post.author)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatTime(post.timestamp)} • On-chain
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="mb-4 text-base sm:text-lg whitespace-pre-wrap break-words">
                {post.content}
              </p>

              {/* Actions */}
              <div className="flex gap-4 sm:gap-6 mb-4 border-t border-white/10 pt-4">
                <button
                  onClick={() => toggleLike(post.id, post.hasLiked)}
                  className={`flex items-center gap-2 ${
                    post.hasLiked ? 'text-red-400' : 'text-gray-400'
                  } hover:text-red-400 transition text-sm sm:text-base`}
                  disabled={!web3State.account || loading}
                >
                  <Heart
                    size={18}
                    fill={post.hasLiked ? 'currentColor' : 'none'}
                  />
                  <span className="font-semibold">{post.likes}</span>
                </button>

                <button
                  onClick={() =>
                    setShowComments({
                      ...showComments,
                      [post.id]: !showComments[post.id]
                    })
                  }
                  className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition text-sm sm:text-base"
                >
                  <MessageCircle size={18} />
                  <span className="font-semibold">{post.comments.length}</span>
                </button>

                <button
                  onClick={() => sharePost(post.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition text-sm sm:text-base"
                  disabled={!web3State.account || loading}
                >
                  <Share2 size={18} />
                  <span className="font-semibold">{post.shares}</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                  {post.comments.map((comment, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold truncate">
                          {shortAddr(comment.author)}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm break-words">{comment.text}</p>
                    </div>
                  ))}

                  {/* Add Comment */}
                  {web3State.account && (
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={comments[post.id] || ''}
                        onChange={(e) =>
                          setComments({ ...comments, [post.id]: e.target.value })
                        }
                        placeholder="Write a comment..."
                        className="flex-1 bg-white/5 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 text-white placeholder-gray-400 text-sm sm:text-base"
                        onKeyPress={(e) =>
                          e.key === 'Enter' && addComment(post.id)
                        }
                        disabled={loading}
                      />
                      <button
                        onClick={() => addComment(post.id)}
                        disabled={loading || !comments[post.id]?.trim()}
                        className="bg-purple-600 p-2 sm:p-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && web3State.account && (
          <div className="text-center text-gray-400 mt-12 bg-black/30 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/10">
            <p className="text-base sm:text-lg">No posts yet on the blockchain</p>
            <p className="text-sm mt-2">Be the first to post!</p>
          </div>
        )}

        {/* Connect Wallet Prompt */}
        {!web3State.account && (
          <div className="text-center text-gray-400 mt-12 bg-black/30 backdrop-blur-xl rounded-2xl p-8 sm:p-12 border border-white/10">
            <Wallet size={48} className="mx-auto mb-4 text-purple-400" />
            <p className="text-base sm:text-lg">Connect your wallet to get started</p>
            <p className="text-sm mt-2">All posts stored on IPFS + Blockchain</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 