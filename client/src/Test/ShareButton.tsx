import { useState, useEffect } from 'react';
import axios from 'axios';
import { Share2, Loader2 } from 'lucide-react';
import { requestSignature } from '../helper/authHelper';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface ShareButtonProps {
  postId: string;
  currentUser: string;
  onShareChange?: (count: number) => void;
}

const ShareButton = ({ postId, currentUser, onShareChange }: ShareButtonProps) => {
  const [shareCount, setShareCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShareCount();
  }, [postId]);

  const fetchShareCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/shares/${postId}`);
      const count = response.data.count || 0;
      setShareCount(count);
    } catch (err) {
      console.error('Error fetching share count:', err);
    }
  };

  const handleShare = async () => {
    if (loading || !currentUser) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Request signature để xác thực
      const authResult = await requestSignature(currentUser);
      
      if (!authResult.success) {
        setError(authResult.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      console.log('✅ Authentication successful');

      // 2. Thực hiện share
      const response = await axios.post(`${API_URL}/shares`, {
        postId,
        author: currentUser
      });
      
      console.log('✅ Share success:', response.data);
      
      const newCount = shareCount + 1;
      setShareCount(newCount);
      onShareChange?.(newCount);

      // Show success message
      alert('Post shared successfully! Transaction: ' + response.data.transactionHash);

    } catch (err: any) {
      console.error('❌ Error sharing post:', err);
      setError(err.response?.data?.error || 'Failed to share post');
      alert(err.response?.data?.error || 'Failed to share post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button 
        onClick={handleShare}
        disabled={loading}
        className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          {shareCount > 0 ? shareCount : 'Share'}
        </span>
      </button>
      
      {error && (
        <p className="text-xs text-red-500 ml-7">{error}</p>
      )}
    </div>
  );
};

export default ShareButton;