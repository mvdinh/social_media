import { useState, useEffect, use } from 'react';
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

  useEffect(() => {
    //get all post
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/post/posts`);
        console.log('Fetched posts:', response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
  })

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
      console.log('📄 Contract initialized:', contract);
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

    // STEP 3: Verify user signature
    const { user, token } = await verifySignature(account);
    console.log('User verified:', user, token);

    // STEP 4–5: Upload to IPFS
    const { contentHash, mediaHashes } = await uploadToIpfs(content, account, files);

    // STEP 6: Create post on blockchain
    
  let tx;
  try {
    console.log("🚀 Creating post...");
    // Gọi hàm Solidity
    tx =
      mediaHashes.length > 0
        ? await contract.createPostWithMedia(contentHash, mediaHashes, 1) // 1 = IMAGE
        : await contract.createPost(contentHash);
  } catch (error: any) {
    if (error.code === "ACTION_REJECTED" || error.code === 4001) {
      throw new Error("❌ You rejected the transaction.");
    }
    console.error("🚨 Transaction failed:", error);
    throw error;
  }

  console.log("⏳ Waiting for transaction confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed! Hash:", receipt.hash);

  // ✅ Lấy event PostCreated từ receipt.logs
  const eventTopic = contract.interface.getEvent("PostCreated").topicHash;
  const log = receipt.logs.find((l) => l.topics[0] === eventTopic);

  let postId;
  if (log) {
    const parsed = contract.interface.parseLog(log);
    postId = parsed.args.postId.toString();
    console.log("📝 Post ID:", postId);
  } else {
    console.warn("⚠️ Không tìm thấy event PostCreated trong logs.");
  }

    // STEP 8: Sync to backend
  if (postId) {
  console.log('🔄 Step 8: Syncing to backend...');
  
  try {
    const response = await axios.post(
      `${API_URL}/post/post/${postId}`,
      {
        txHash: receipt.hash
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );
    
    if (response && response.data) {
      console.log('✅ Post synced to backend:', response.data);
      alert(`✅ Post created successfully!\n\nPost ID: ${postId}\nTx: ${receipt.hash}`);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      console.warn('⚠️ Empty response from backend');
    }
    
  } catch (syncError) {
    console.error('❌ Failed to sync to backend:', syncError);
    
    // Xử lý lỗi Axios
    if (axios.isAxiosError(syncError)) {
      const { response, request, code } = syncError;
      
      // Lỗi từ server (có response)
      if (response) {
        console.error('📡 Server Error Details:');
        console.error('- Status:', response.status);
        console.error('- Status Text:', response.statusText);
        console.error('- Data:', response.data);
        console.error('- Headers:', response.headers);
        
        switch (response.status) {
          case 400:
            console.error('❌ Bad Request: Invalid data sent to server');
            break;
          case 401:
            console.error('❌ Unauthorized: Authentication required');
            break;
          case 403:
            console.error('❌ Forbidden: No permission to sync');
            break;
          case 404:
            console.error('❌ Not Found: Sync endpoint not available');
            break;
          case 409:
            console.error('⚠️ Conflict: Post may already be synced');
            break;
          case 500:
            console.error('❌ Internal Server Error');
            break;
          case 502:
            console.error('❌ Bad Gateway: Server is down or unreachable');
            break;
          case 503:
            console.error('❌ Service Unavailable: Server temporarily down');
            break;
          case 504:
            console.error('❌ Gateway Timeout: Server took too long to respond');
            break;
          default:
            console.error(`❌ Unexpected status code: ${response.status}`);
        }
      } 
      // Request được gửi nhưng không nhận được response
      else if (request) {
        console.error('📡 Network Error Details:');
        console.error('- Request was made but no response received');
        console.error('- Request:', request);
        
        if (code === 'ECONNABORTED') {
          console.error('⏱️ Request Timeout: Server took longer than 10 seconds');
        } else if (code === 'ERR_NETWORK') {
          console.error('🌐 Network Error: Check your internet connection');
        } else if (code === 'ERR_CONNECTION_REFUSED') {
          console.error('🚫 Connection Refused: Backend server is not running');
        } else {
          console.error('❌ Network Error Code:', code);
        }
      } 
      // Lỗi khi setup request
      else {
        console.error('⚙️ Request Setup Error:', syncError.message);
      }
      
      // Log full error config
      console.error('🔧 Request Config:', {
        url: syncError.config?.url,
        method: syncError.config?.method,
        timeout: syncError.config?.timeout,
        headers: syncError.config?.headers
      });
    } 
    // Lỗi không phải từ Axios
    else {
      console.error('❌ Unexpected Error Type:', {
        name: (syncError as Error).name,
        message: (syncError as Error).message,
        stack: (syncError as Error).stack
      });
    }
    
    // ⚠️ Không throw error, vì post đã được tạo trên blockchain thành công
    console.warn('⚠️ Post created on blockchain but sync failed. It will be synced later.');
    console.warn(`📝 Post ID: ${postId}`);
    console.warn(`🔗 Tx Hash: ${receipt.hash}`);
    
    // Hiển thị warning cho user với thông tin chi tiết hơn
    const errorMessage = axios.isAxiosError(syncError) 
      ? syncError.response?.data?.message || syncError.message
      : (syncError as Error).message;
      
    alert(
      `⚠️ Post created on blockchain successfully but backend sync failed.\n\n` +
      `Post ID: ${postId}\n` +
      `Tx: ${receipt.hash}\n\n` +
      `Error: ${errorMessage}\n\n` +
      `Don't worry! Your post will be synced automatically later.`
    );
  }
}

    // // Reset
    // setContent('');
    // setFiles([]);
    // setPreviews([]);

    

  } catch (error: any) {
    console.error('❌ Error creating post:', error);
    let msg = error.response?.data?.error || error.message || 'Failed to create post';
    alert(`❌ ${msg}`);
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
      
      {/* Connected account & Test button */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Connected: <span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
        </p>
        
        
      </div>
    </div>
  );
};

export default CreatePost;