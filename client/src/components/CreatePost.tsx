import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

const CreatePost: React.FC = () => {
  const { account, contract, connectWallet, loading: walletLoading, executeGaslessTransaction } = useWallet();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !contract) {
      setError('Vui lòng kết nối ví MetaMask để đăng bài');
      return;
    }

    if (!content.trim()) {
      setError('Nội dung không được để trống');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Simulate IPFS upload - trong production, upload lên IPFS thật
      const contentCID = `ipfs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Thực hiện giao dịch không tốn ETH
      const result = await executeGaslessTransaction(
        contract.createPost(contentCID),
        '✅ Đăng bài thành công! (Không mất ETH)'
      );

      if (result.success) {
        setContent('');
        setSuccess(result.message || 'Đăng bài thành công!');
        
        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Có lỗi xảy ra');
      }
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      setError('Lỗi khi đăng bài: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu chưa kết nối ví
  if (!account) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Kết nối ví để đăng bài
          </h3>
          <p className="text-gray-600 mb-4">
            Vui lòng kết nối MetaMask để có thể đăng bài và tương tác
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
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Đăng bài mới</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Đăng bài với:</span>
            <span className="font-mono font-semibold text-blue-600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì? 💭"
          rows={4}
          maxLength={280}
          disabled={isLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between">
          <span className={`text-sm ${content.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
            {content.length}/280
          </span>
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang đăng...
              </>
            ) : (
              <>📤 Đăng bài (Free)</>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;