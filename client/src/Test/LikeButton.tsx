import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThumbsUp, Loader2 } from 'lucide-react';
import { getContract, getCurrentAccount } from '../utils/contractUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface LikeButtonProps {
  postId: string;
  likesCount: number;
  onLikeChange?: (liked: boolean, count: number) => void;
}

const LikeButton = ({ postId, likesCount, onLikeChange }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState("");
  const [likeCount, setLikeCount] = useState(likesCount || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // ===== Load wallet =====
  useEffect(() => {
    const loadWallet = async () => {
      let address = await getCurrentAccount();
      if (!address && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          });
          address = accounts?.[0] || null;
        } catch {
          console.warn('❌ User rejected MetaMask connection');
        }
      }
      setUserAddress(address);
    };
    loadWallet();
  }, []);

  // ===== Fetch like status once =====
  useEffect(() => {
    if (!userAddress || !postId) return;
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/likes/check/${postId}/${userAddress}`);
        setIsLiked(res.data.data?.isLiked);
        console.log('✅ Fetched like status:', res.data.data);
      } catch (err) {
        console.error('❌ Failed to fetch like status:', err);
      }
    };
    fetchStatus();
  }, [userAddress, postId]);

  // ===== Handle like/unlike =====
  const handleLike = async () => {
  if (loading) return;
  if (!userAddress) {
    setError('Please connect your wallet to like posts.');
    return;
  }

  setLoading(true);
  setError(null);

  console.log('💙 Like status trước khi bấm:', isLiked);
  console.log('🧩 Post ID:', postId);
  console.log('👤 User:', userAddress);

  try {
    const contract = await getContract();
    let tx, receipt;

    if (isLiked == true) {
      // 👎 UNLIKE
      console.log('🚀 Sending transaction: unlikePost...');
      tx = await contract.unlikePost(postId);
      console.log('🧾 Transaction sent:', tx);

      receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      console.log('🌐 Gửi DELETE /likes API:', {
        txHash: receipt.hash,
        postId,
        user: userAddress,
      });

      await axios.delete(`${API_URL}/likes`, {
        data: {
          txHash: receipt.hash,
          postId,
          user: userAddress,
        },
      });

      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
      console.log('✅ Đã unlike thành công!');
    } else {
      // 👍 LIKE
      console.log('🚀 Sending transaction: likePost...');
      tx = await contract.likePost(postId);
      console.log('🧾 Transaction sent:', tx);

      receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      console.log('🌐 Gửi POST /likes API:', {
        txHash: receipt.hash,
        postId,
        user: userAddress,
      });

      await axios.post(`${API_URL}/likes`, {
        txHash: receipt.hash,
        postId,
        user: userAddress,
      });

      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      console.log('✅ Đã like thành công!');
    }

    onLikeChange?.(!isLiked, isLiked ? likeCount - 1 : likeCount + 1);
  } catch (err: any) {
    console.error('❌ Error toggling like:', err);
    setError(err.message || 'Transaction failed');
  } finally {
    setLoading(false);
  }
};


  // ===== UI =====
  if (!userAddress) {
    return (
      <button
        disabled
        className="flex items-center gap-2 text-gray-400 cursor-not-allowed"
        title="Connect wallet to like"
      >
        <ThumbsUp className="w-5 h-5" />
        <span className="text-sm font-medium">
          {likeCount > 0 ? likeCount : 'Like'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ThumbsUp
            className={`w-5 h-5 transition-all ${
              isLiked
                ? 'fill-current stroke-current scale-110'
                : 'stroke-current text-transparent'
            }`}
          />
        )}
        <span className="text-sm font-medium">
          {likeCount > 0 ? likeCount : 'Like'}
        </span>
      </button>

      {error && (
        <p className="text-xs text-red-500 ml-7 mt-1 max-w-xs">{error}</p>
      )}
    </div>
  );
};

export default LikeButton;
