import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Loader2, X } from 'lucide-react';
import GetAllComments from './GetAllComments';
import { getContract, getCurrentAccount } from '../utils/contractUtils';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface CommentButtonProps {
  postId: string;
  onCommentChange?: (count: number) => void;
}

const CommentButton = ({ postId, onCommentChange }: CommentButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [contentHash, setContentHash] = useState('');
  const [mediaHash, setMediaHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  // Load wallet
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

  const handleOpenModal = () => {
    setShowModal(true);
    setContentHash('');
    setMediaHash('');
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setContentHash('');
    setMediaHash('');
    setError(null);
  };

  const handleSubmitComment = async () => {
    if (loading || !userAddress || !contentHash.trim()) {
      setError('Content hash is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();

      // 1️⃣ Gửi transaction lên blockchain
      console.log('🚀 Sending addComment transaction...');
      const tx = await contract.addComment(postId, contentHash.trim());
      console.log('🧾 Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // 2️⃣ Gửi dữ liệu lên backend
      const payload = {
        postId,
        author: userAddress,
        contentHash: contentHash.trim(),
        mediaHash: mediaHash.trim(),
        txHash: receipt.hash,
      };

      console.log('🌐 Sending POST /comments:', payload);
      const response = await axios.post(`${API_URL}/comments`, payload);
      console.log('✅ Comment saved to backend:', response.data);

      alert('Comment added successfully! Transaction: ' + receipt.hash);

      handleCloseModal();
      onCommentChange?.(1);

    } catch (err: any) {
      console.error('❌ Error adding comment:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add comment';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Comment</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Comments</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Comment Form */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-800">Add Comment</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Hash <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contentHash}
                    onChange={(e) => setContentHash(e.target.value)}
                    placeholder="Enter IPFS content hash (e.g., QmXx...)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media Hash (optional)
                  </label>
                  <input
                    type="text"
                    value={mediaHash}
                    onChange={(e) => setMediaHash(e.target.value)}
                    placeholder="Enter IPFS media hash (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmitComment}
                  disabled={loading || !contentHash.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Adding Comment...</span>
                    </>
                  ) : (
                    <span>Add Comment</span>
                  )}
                </button>
              </div>

              {/* Comments List */}
              <div className="border-t border-gray-200 pt-6">
                <GetAllComments postId={postId} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentButton;
