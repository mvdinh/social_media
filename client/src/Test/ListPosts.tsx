import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import PostCard from './PostCard';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Post {
  postId: number;        
  user: string;              
  contentHash: string;         
  mediaHashes?: string[];      
  mediaType: 0 | 1 | 2 | 3;   
  likes: number;               
  shares: number;              
  comments: number;            
}

const ListPosts = () => {
  const {address , contract } = useAuth();

  const [dataPosts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    console.log('📊 Updated dataPosts:', dataPosts);
    console.log('user', address)
  }, [dataPosts, address]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/post/`, { timeout: 10000 });
      console.log('📥 Fetched posts:', response.data.posts);
      setPosts(response.data.posts);
      console.log('✅ Posts loaded successfully', response.data.posts);                                          
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
        setError('Failed to load posts.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-red-200 p-8 text-center">
        <div className="text-red-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load posts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (dataPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
        <div className="text-gray-400 mb-3">
          <ImageIcon className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No posts yet</h3>
        <p className="text-gray-600 mb-4">Be the first to create a post!</p>
        <button
          onClick={fetchPosts}
          className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-semibold text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dataPosts.map((post) => (
        <PostCard
          key={post._id}
          post={post}
          user={address}
          contract={contract}
        />
      ))}

      <div className="text-center pt-2">
        <button
          onClick={fetchPosts}
          className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-semibold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Posts
        </button>
      </div>
    </div>
  );
};

export default ListPosts;
