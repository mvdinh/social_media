import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Contract imports
import contractAddress from './config/contract-address.json';
import contractABI from './config/SocialMedia.json';

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Post {
  id: number;
  author: string;
  contentHash: string;
  mediaHashes: string[];
  mediaType: number;
  timestamp: number;
  likes: number;
  shares: number;
  content?: string;
  mediaUrls?: string[];
  isNFT: boolean;
}

enum MediaType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  MIXED = 3
}

function App() {
  
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New post state
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  // ===============================================
  // Connect Wallet
  // ===============================================
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      setLoading(true);
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send('eth_requestAccounts', []);
      const userSigner = await web3Provider.getSigner();
      const userAccount = await userSigner.getAddress();
      
      const socialMediaContract = new ethers.Contract(
        contractAddress.SocialMedia,
        contractABI.abi,
        userSigner
      );

      setProvider(web3Provider);
      setAccount(userAccount);
      setContract(socialMediaContract);

      console.log('✅ Wallet connected:', userAccount);
      await loadPosts(socialMediaContract, userAccount);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // Load Posts from Blockchain + IPFS
  // ===============================================
  const loadPosts = async (contractInstance: ethers.Contract, userAddr: string) => {
    try {
      setLoading(true);
      const count = await contractInstance.postCount();
      const loadedPosts: Post[] = [];

      // Load last 20 posts
      for (let i = Number(count); i >= Math.max(1, Number(count) - 19); i--) {
        try {
          const post = await contractInstance.getPost(i);
          
          // Fetch content from IPFS
          let content = '';
          try {
            const res = await fetch(`${API_URL}/ipfs/${post.contentHash}`);
            const data = await res.json();
            content = data.content || data.desc || '';
          } catch (err) {
            console.error('IPFS fetch error:', err);
            content = 'Content loading failed';
          }

          // Get media URLs if exists
          const mediaUrls: string[] = [];
          for (const hash of post.mediaHashes) {
            mediaUrls.push(`${API_URL}/ipfs/${hash}`);
          }

          loadedPosts.push({
            id: Number(post.id),
            author: post.author,
            contentHash: post.contentHash,
            mediaHashes: post.mediaHashes,
            mediaType: Number(post.mediaType),
            timestamp: Number(post.timestamp),
            likes: Number(post.likes),
            shares: Number(post.shares),
            content,
            mediaUrls,
            isNFT: post.isNFT
          });
        } catch (err) {
          console.error(`Error loading post ${i}:`, err);
        }
      }

      setPosts(loadedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  



  // ===============================================
  // Like Post
  // ===============================================
  const likePost = async (postId: number) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.likePost(postId);
      console.log('⏳ Liking post...');
      
      await tx.wait();
      console.log('✅ Post liked');

      await loadPosts(contract, account);
    } catch (error: any) {
      console.error('Error liking post:', error);
      if (error.message?.includes('Already liked')) {
        alert('You already liked this post');
      } else {
        alert('Failed to like post');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // Unlike Post
  // ===============================================
  const unlikePost = async (postId: number) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.unlikePost(postId);
      await tx.wait();
      await loadPosts(contract, account);
    } catch (error: any) {
      console.error('Error unliking post:', error);
      alert(error.message || 'Failed to unlike post');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // Share Post
  // ===============================================
  const sharePost = async (postId: number) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.sharePost(postId);
      await tx.wait();
      await loadPosts(contract, account);
      alert('Post shared!');
    } catch (error) {
      console.error('Error sharing post:', error);
      alert('Failed to share post');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // Mint Post as NFT
  // ===============================================
  const mintAsNFT = async (postId: number) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.mintPostAsNFT(postId);
      console.log('⏳ Minting NFT...');
      
      await tx.wait();
      console.log('✅ NFT minted!');
      
      await loadPosts(contract, account);
      alert('Post minted as NFT! 🎉');
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      alert(error.message || 'Failed to mint NFT');
    } finally {
      setLoading(false);
    }
  };

  // ===============================================
  // Check if user liked post
  // ===============================================
  const checkUserLiked = async (postId: number): Promise<boolean> => {
    if (!contract || !account) return false;
    try {
      return await contract.getUserLiked(postId, account);
    } catch {
      return false;
    }
  };

  // ===============================================
  // Helper: Get Media Type Label
  // ===============================================
  const getMediaTypeLabel = (type: number): string => {
    switch (type) {
      case MediaType.TEXT: return '📝 Text';
      case MediaType.IMAGE: return '🖼️ Image';
      case MediaType.VIDEO: return '🎬 Video';
      case MediaType.MIXED: return '🎨 Mixed';
      default: return 'Unknown';
    }
  };

  // ===============================================
  // Render
  // ===============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Web3 Social DApp
            </h1>
            <p className="text-sm text-gray-400 mt-1">Post • Like • Share • Mint NFT</p>
          </div>
          
          {!account ? (
            <button 
              onClick={connectWallet} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl hover:opacity-90 transition"
              disabled={loading}
            >
              {loading ? '⏳ Connecting...' : '🔗 Connect Wallet'}
            </button>
          ) : (
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </header>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200">
            {error}
            <button onClick={() => setError('')} className="float-right">✕</button>
          </div>
        )}

        {account && (
          <main>
            {/* Create Post Section */}
            <section className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-white/10">
              <h2 className="text-2xl font-bold mb-4">✍️ Create Post</h2>
              
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-white/5 rounded-xl p-4 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10 text-white placeholder-gray-400"
                rows={4}
                disabled={posting}
              />

              {/* File Upload */}
              <div className="mb-4">
                <label className="block mb-2 text-sm text-gray-300">
                  📎 Attach Images/Videos (optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  disabled={posting}
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-400">
                    Selected: {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              <button
                onClick={createPost}
                disabled={posting || !newPostContent.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded-xl hover:opacity-90 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {posting ? '⏳ Posting...' : '📤 Post to Blockchain'}
              </button>
            </section>

            {/* Posts Feed */}
            <section>
              <h2 className="text-2xl font-bold mb-4">📰 Feed</h2>
              
              {loading && (
                <div className="text-center text-gray-400 py-8">
                  Loading posts...
                </div>
              )}
              
              {!loading && posts.length === 0 && (
                <div className="text-center text-gray-400 bg-black/30 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
                  <p className="text-lg">No posts yet</p>
                  <p className="text-sm mt-2">Be the first to post!</p>
                </div>
              )}

              <div className="space-y-4">
                {posts.map((post) => (
                  <article key={post.id} className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full"></div>
                        <div>
                          <div className="font-semibold">
                            {post.author.slice(0, 6)}...{post.author.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(post.timestamp * 1000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-500/20 px-2 py-1 rounded">
                          {getMediaTypeLabel(post.mediaType)}
                        </span>
                        {post.isNFT && (
                          <span className="text-xs bg-yellow-500/20 px-2 py-1 rounded">
                            🎨 NFT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-lg whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Media Display */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        {post.mediaUrls.map((url, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden bg-black/50">
                            {post.mediaType === MediaType.IMAGE || post.mediaType === MediaType.MIXED ? (
                              <img src={url} alt="Post media" className="w-full h-48 object-cover" />
                            ) : (
                              <video src={url} controls className="w-full h-48" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex gap-4 border-t border-white/10 pt-4">
                      <button
                        onClick={() => likePost(post.id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
                      >
                        ❤️ <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={() => sharePost(post.id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition"
                      >
                        🔄 <span>{post.shares}</span>
                      </button>
                      {post.author.toLowerCase() === account.toLowerCase() && !post.isNFT && (
                        <button
                          onClick={() => mintAsNFT(post.id)}
                          className="ml-auto bg-yellow-500/20 px-4 py-2 rounded-lg hover:bg-yellow-500/30 transition text-sm"
                        >
                          🎨 Mint as NFT
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;