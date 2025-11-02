import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { Image, X, Loader2, Shield } from 'lucide-react';
import { verifySignature } from '../../helper/VerifySignature';
import { uploadToIpfs } from '../../helper/UploadToIpfs';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Import contract config
import contractAddress from '../../config/contract-address.json';
import contractABI from '../../config/SocialMedia.json';

const CreatePost = () => {
  const [contract, setContract] = useState<any>(null);
  const [account, setAccount] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/post`);
        console.log('📥 Fetched posts:', response.data);
      } catch (error) {
        console.error('❌ Error fetching posts:', error);
      }
    };

    fetchPosts();
  }, []);

  // Initialize contract on mount
  useEffect(() => {
    initContract();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountChange);
      return () => window.ethereum.removeAllListeners('accountsChanged');
    }
  }, []);

  const handleAccountChange = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      initContract();
    }
  };

  const initContract = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const socialMediaContract = new ethers.Contract(
        contractAddress.SocialMedia,
        contractABI.abi,
        signer
      );

      setContract(socialMediaContract);
      setAccount(accounts[0]);
      console.log('✅ Connected:', accounts[0]);
    } catch (error) {
      console.error('❌ Init error:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 4 - files.length);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const createPost = async () => {
    if (!contract || !content.trim()) {
      alert('Please write something!');
      return;
    }

    try {
      setPosting(true);

      // STEP 1: Verify user signature
      console.log('🔐 Step 1: Verifying signature...');
      const { user, token } = await verifySignature(account);
      console.log('✅ User verified:', user);

      // STEP 2: Upload to IPFS
      console.log('📤 Step 2: Uploading to IPFS...');
      const { contentHash, mediaHashes } = await uploadToIpfs(content, account, files);
      console.log('✅ IPFS upload complete:', { contentHash, mediaHashes });

      // STEP 3: Call backend API để tạo post
      // Backend sẽ tự động tạo transaction trên blockchain và lưu vào DB
      console.log('🔄 Step 3: Creating post via backend API...');
      
      const postData = {
        contentHash,
        mediaHashes: mediaHashes.length > 0 ? mediaHashes : undefined,
        mediaType: mediaHashes.length > 0 ? 1 : 0, // 1 = IMAGE, 0 = TEXT_ONLY
        walletAddress: account
      };

      console.log('📤 Sending data to backend:', postData);

      const response = await axios.post(
        `${API_URL}/post`,
        postData,
        
      );

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        const { blockchainPostId, txHash, dbPostId } = response.data;

        // Success notification
        alert(
          `✅ Post created successfully!\n\n` +
          `Post ID: ${blockchainPostId}\n` +
          `Database ID: ${dbPostId}\n` +
          `Transaction: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`
        );

        // Reset form
        setContent('');
        setFiles([]);
        setPreviews([]);

        // Reload to show new post
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('Backend returned unsuccessful response');
      }

    } catch (error: any) {
      console.error('❌ Error creating post:', error);

      // Detailed error handling
      if (axios.isAxiosError(error)) {
        const { response, code } = error;

        if (response) {
          console.error('📡 Server Error:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
          });

          const errorMsg = response.data?.error || response.statusText;
          
          switch (response.status) {
            case 400:
              alert(`❌ Invalid data: ${errorMsg}`);
              break;
            case 401:
              alert('❌ Authentication failed. Please reconnect your wallet.');
              break;
            case 500:
              alert(`❌ Server error: ${errorMsg}\n\nPlease try again.`);
              break;
            default:
              alert(`❌ Error (${response.status}): ${errorMsg}`);
          }
        } else if (code === 'ECONNABORTED') {
          alert('⏱️ Request timeout. The blockchain transaction may take longer.\n\nPlease check your post in a moment.');
        } else if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED') {
          alert('🌐 Cannot connect to server.\n\nPlease make sure the backend is running at ' + API_URL);
        } else {
          alert(`❌ Network error: ${error.message}`);
        }
      } else {
        // Non-axios errors (e.g., from verifySignature or uploadToIpfs)
        const errorMsg = error.message || 'Unknown error occurred';
        alert(`❌ ${errorMsg}`);
      }

    } finally {
      setPosting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-4">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting wallet...</span>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!contract || !account) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-4 text-center">
        <p className="text-gray-600 mb-4">Please connect your wallet to create posts</p>
        <button 
          onClick={initContract}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const charCount = content.length;
  const maxChars = 280;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
          {account.slice(2, 4).toUpperCase()}
        </div>
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border-none focus:outline-none text-gray-800 placeholder-gray-400 text-base resize-none"
            rows={3}
            placeholder="What's on your mind?"
            disabled={posting}
            maxLength={maxChars + 50}
          />

          {previews.length > 0 && (
            <div className={`grid gap-2 mt-3 ${
              previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                  {files[index].type.startsWith('image/') ? (
                    <img src={preview} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <video src={preview} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 bg-gray-900 bg-opacity-75 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={posting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <label className={`p-2 rounded-full transition-colors ${
                posting || files.length >= 4
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-blue-500 hover:bg-blue-50 cursor-pointer'
              }`}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={posting || files.length >= 4} 
                />
                <Image className="w-5 h-5" />
              </label>
              
              {files.length > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  {files.length}/4
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={`text-sm font-medium ${
                  isOverLimit ? 'text-red-500' : 
                  charCount > maxChars * 0.9 ? 'text-orange-500' : 
                  'text-gray-400'
                }`}>
                  {charCount}/{maxChars}
                </span>
              )}
              
              <button 
                onClick={createPost}
                disabled={posting || !content.trim() || isOverLimit}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {posting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Connected account info */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Connected: <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
        </p>
      </div>
    </div>
  );
};

export default CreatePost;