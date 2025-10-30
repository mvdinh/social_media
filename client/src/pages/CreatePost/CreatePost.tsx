import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { Image, X, Loader2, Shield } from 'lucide-react';

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

  // Test nonce function
  const testNonce = async () => {
    try {
      console.log('🧪 Testing nonce with address:', account);
      
      const response = await axios.post(`${API_URL}/auth/nonce`, {
        address: account
      });
      
      console.log('✅ Nonce response:', response.data);
      alert(`Nonce test successful!\n\nNonce: ${response.data.nonce}\nMessage: ${response.data.message}`);
    } catch (error: any) {
      console.error('❌ Nonce test failed:', error.response?.data || error.message);
      alert(`Nonce test failed!\n\n${error.response?.data?.error || error.message}`);
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
      console.log('🚀 Starting post creation for account:', account);

      // STEP 1: Get nonce for authentication
      console.log('📝 Step 1: Requesting nonce...');
      const nonceResponse = await axios.post(`${API_URL}/auth/nonce`, {
        address: account
      });

      const { nonce, message } = nonceResponse.data;
      console.log('✅ Nonce received:', nonce);
      console.log('📜 Message to sign:', message);

      // STEP 2: Request MetaMask signature for authentication
      console.log('🔐 Step 2: Opening MetaMask for authentication signature...');
      alert('⚠️ MetaMask will open!\n\nPlease sign the message to authenticate your account.\n\nThis does NOT cost any gas.');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let signature;
      try {
        signature = await signer.signMessage(message);
        console.log('✅ Signature obtained:', signature.slice(0, 20) + '...');
      } catch (error: any) {
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          throw new Error('You rejected the authentication signature');
        }
        throw error;
      }

      // STEP 3: Verify signature
      console.log('🔍 Step 3: Verifying signature...');
      const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
        address: account,
        signature
      });

      const { user } = verifyResponse.data;
      console.log('✅ Authentication successful! User:', user.username);

      // STEP 4: Upload content to IPFS
      console.log('📤 Step 4: Uploading content to IPFS...');
      const postData = { 
        content, 
        author: account, 
        username: user.username,
        timestamp: Date.now(),
        nonce
      };

      const contentResponse = await axios.post(`${API_URL}/ipfs/upload-json`, postData);
      const contentHash = contentResponse.data.cid;
      console.log('✅ Content uploaded to IPFS:', contentHash);

      // STEP 5: Upload media files if any
      let mediaHashes: string[] = [];
      if (files.length > 0) {
        console.log(`📤 Step 5: Uploading ${files.length} media files...`);
        
        const uploadPromises = files.map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await axios.post(`${API_URL}/ipfs/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          console.log(`✅ File ${index + 1}/${files.length} uploaded:`, response.data.cid);
          return response.data.cid;
        });

        mediaHashes = await Promise.all(uploadPromises);
      }

      // STEP 6: Create post on blockchain
      console.log('⛓️ Step 6: Creating post on blockchain...');
      alert('⚠️ MetaMask will open again!\n\nPlease confirm the transaction to create your post on blockchain.\n\nThis WILL cost gas fees.');
      
      let tx;
      try {
        if (mediaHashes.length > 0) {
          tx = await contract.createPostWithMedia(contentHash, mediaHashes, 1);
        } else {
          tx = await contract.createPost(contentHash);
        }
      } catch (error: any) {
        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          throw new Error('You rejected the transaction');
        }
        throw error;
      }

      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed! Hash:', receipt.hash);
      
      // STEP 7: Get postId from event
      console.log('🔍 Step 7: Extracting post ID from event...');
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === contract.interface.getEvent('PostCreated').topicHash
      );
      
      let postId;
      if (event) {
        const decoded = contract.interface.parseLog(event);
        postId = decoded.args.postId.toString();
        console.log('📝 Post ID:', postId);
      }

      // STEP 8: Sync to backend
      if (postId) {
        console.log('🔄 Step 8: Syncing to backend...');
        await axios.post(`${API_URL}/sync/post/${postId}`, {
          txHash: receipt.hash
        });
        console.log('✅ Post synced to backend');
      }

      // Success - reset form
      setContent('');
      setFiles([]);
      setPreviews([]);
      
      console.log('🎉 Post creation completed successfully!');
      alert(`✅ Post created successfully!\n\nPost ID: ${postId}\nTransaction: ${receipt.hash}\n\nReloading timeline...`);

      // Reload after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      
      let msg = 'Failed to create post';
      
      if (error.response) {
        // Axios error with response
        msg = error.response.data?.error || error.response.data?.details || msg;
      } else if (error.message) {
        // Custom error message
        msg = error.message;
      }
      
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
        
        <button
          onClick={testNonce}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
        >
          🧪 Test Nonce
        </button>
      </div>
    </div>
  );
};

export default CreatePost;