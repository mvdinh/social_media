import { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, Loader2, User, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface Share {
  _id: string;
  postId: number;
  author: string;
  txHash: string;
  timestamp: string;
}

interface GetAllSharesProps {
  postId: string;
}

const GetAllShares = ({ postId }: GetAllSharesProps) => {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShares();
  }, [postId]);

  const fetchShares = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/shares/${postId}`);
      
      if (response.data.success) {
        setShares(response.data.shares || []);
      }
    } catch (err: any) {
      console.error('❌ Error fetching shares:', err);
      setError(err.response?.data?.error || 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
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

  if (shares.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Share2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No shares yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">
          Shares ({shares.length})
        </h3>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {shares.map((share) => (
          <div 
            key={share._id}
            className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold shrink-0">
              {share.author.slice(2, 4).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-mono text-sm text-gray-700 truncate">
                  {formatAddress(share.author)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(share.timestamp)}</span>
              </div>
            </div>

            <Share2 className="w-5 h-5 text-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GetAllShares;