import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import PostItem from './PostItem';

interface Post {
  id: number;
  author: string;
  contentCID: string;
  timestamp: bigint;
  likes: number;
}

const Feed: React.FC = () => {
  const { account, contract, connectWallet, loading: walletLoading } = useWallet();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contract && account) {
      loadPosts();
    }
  }, [contract, account]);

  const loadPosts = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');
      
      console.log('Loading posts from contract...');
      
      // Gọi function getPosts từ contract
      const postsData = await contract.getPosts();
      
      console.log('Posts data:', postsData);
      
      // Transform data
      const transformedPosts: Post[] = postsData.map((p: any) => ({
        id: Number(p.id),
        author: p.author,
        contentCID: p.contentCID,
        timestamp: p.timestamp,
        likes: Number(p.likes)
      }));
      
      // Sắp xếp theo timestamp mới nhất
      transformedPosts.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      
      setPosts(transformedPosts);
      
    } catch (error: any) {
      console.error('Error loading posts:', error);
      setError('Không thể tải bài viết. Đảm bảo contract đã deploy đúng.');
      
      // Demo posts nếu không load được
      setPosts([
        {
          id: 1,
          author: '0x1234567890123456789012345678901234567890',
          contentCID: '🎉 Chào mừng đến với mạng xã hội phi tập trung! Đây là bài post demo.',
          timestamp: BigInt(Math.floor(Date.now() / 1000)),
          likes: 5
        },
        {
          id: 2,
          author: '0x0987654321098765432109876543210987654321',
          contentCID: '💡 Ở đây bạn có thể post, like, comment và share hoàn toàn MIỄN PHÍ!',
          timestamp: BigInt(Math.floor(Date.now() / 1000) - 3600),
          likes: 3
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Nếu chưa kết nối ví
  if (!account) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">👀</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Kết nối ví để xem bài viết
          </h3>
          <p className="text-gray-600 mb-4">
            Kết nối MetaMask để xem feed và tương tác với bài viết
          </p>
          <button
            onClick={connectWallet}
            disabled={walletLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {walletLoading ? 'Đang kết nối...' : '🦊 Kết nối MetaMask'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">📰 Feed</h3>
        <button
          onClick={loadPosts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải...
            </>
          ) : (
            <>🔄 Làm mới</>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">⏳ Đang tải bài viết...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg mb-2">Chưa có bài viết nào</p>
            <p className="text-gray-500">Hãy là người đầu tiên đăng bài!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              onUpdate={loadPosts}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;