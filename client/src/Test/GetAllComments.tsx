import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Loader2, User, Clock, ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Comment {
  _id: string;
  postId: number;
  author: string;
  contentHash: string;
  mediaHash: string;
  txHash: string;
  timestamp: number;
}

interface GetAllCommentsProps {
  postId: string;
}

const GetAllComments = ({ postId }: GetAllCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/comments/${postId}`);
      console.log('comment', response.data)
      
      if (response.data.success) {
        setComments(response.data.data.comments || []);
      }
    } catch (err: any) {
      console.error('❌ Error fetching comments:', err);
      setError(err.response?.data?.error || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">
          Comments ({comments.length})
        </h3>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {comments.map((comment) => (
          <div 
            key={comment._id}
            className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
                {comment.author.slice(2, 4).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm text-gray-700 truncate">
                    {formatAddress(comment.author)}
                  </span>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(comment.timestamp)}</span>
                  </div>
                </div>
                
                <div className="text-gray-800 text-sm mb-2">
                  <p className="font-mono text-xs text-gray-500 mb-1">
                    Hash: {comment.contentHash.slice(0, 20)}...
                  </p>
                </div>

                {comment.mediaHash && comment.mediaHash.trim() !== '' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-flex">
                    <ImageIcon className="w-3 h-3" />
                    <span>Media: {comment.mediaHash.slice(0, 20)}...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GetAllComments;