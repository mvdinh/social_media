import { Image, X, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { verifySignature } from "../helper/VerifySignature";
import { uploadToIpfs } from "../helper/UploadToIpfs";
import { getContract, getCurrentAccount } from "../utils/contractUtils"; // 👈 import từ helper
import axios from "axios";

const CreatePost = () => {
  const acc = {
    name: "John Warren",
    handle: "@john_warren",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40",
  };

  // 👇 Tự quản lý user và contract ở đây
  const [user, setUser] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);

  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  // 🔹 Load account & contract khi component mount
  useEffect(() => {
    const init = async () => {
      try {
        const account = await getCurrentAccount();
        if (!account) {
          alert("Please connect your wallet first!");
          return;
        }
        setUser(account);

        const contractInstance = await getContract();
        setContract(contractInstance);
      } catch (err) {
        console.error("Error loading wallet/contract:", err);
      }
    };
    init();
  }, []);

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 4 - files.length);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target?.result]);
      };
      reader.readAsDataURL(file);
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
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
      
      // === STEP 1: Verify signature ===
      const { user: verifiedUser, token } = await verifySignature(user);
      console.log('✅ User authenticated:', verifiedUser.username || verifiedUser.address);

      // === STEP 2: Upload to IPFS ===
      console.log('📤 Uploading content to IPFS...');
      const { contentHash, mediaHashes } = await uploadToIpfs(content, user, files);
      console.log('✅ IPFS upload complete:', { contentHash, mediaHashes });

      const mediaType = mediaHashes.length > 0 ? 1 : 0;

      // === STEP 3: Send transaction to blockchain ===
      console.log('🔗 Sending transaction to blockchain...');
      console.log('⏳ Please approve the transaction in MetaMask...');

      let tx;
      try {
        if (mediaHashes && mediaHashes.length > 0) {
          tx = await contract.createPostWithMedia(contentHash, mediaHashes, mediaType);
        } else {
          tx = await contract.createPost(contentHash);
        }
        console.log('✅ Transaction sent:', tx.hash);
      } catch (txError) {
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          throw new Error('You rejected the transaction');
        }
        throw txError;
      }

      // === STEP 4: Wait for confirmation ===
      console.log('⏳ Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

      const postData = {
        txHash: receipt.hash,
        walletAddress: user,
        contentHash,
        mediaHashes: mediaHashes.length > 0 ? mediaHashes : undefined,
        mediaType,
      };

      console.log('📤 Sending data to backend:', postData);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/post`,
        postData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('✅ Backend response:', response.data);

      if (response.data.success) {
        const { blockchainPostId, txHash, dbPostId } = response.data;

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

    } catch (error) {
      console.error('❌ Error creating post:', error);
      alert(`Error: ${error.message || 'Failed to create post'}`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create Post</h1>
        <p className="text-gray-500 mt-1">Share your thoughts with the world</p>
      </div>

      <div className="max-w-xl mx-auto md:mx-0 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        {/* Account INFO */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={acc.avatar}
            alt={acc.name}
            className="h-10 w-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="text-gray-800 font-semibold text-sm">{user}</p>
            <p className="text-gray-500 text-xs">{acc.handle}</p>
          </div>
        </div>

        {/* TEXTAREA FOR POST CONTENT */}
        <div className="py-2">
          <textarea
            className="w-full resize-none border-none focus:outline-none text-gray-700 placeholder-gray-400 text-lg"
            rows="3"
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={posting}
          ></textarea>
        </div>

        {/* Image Previews */}
        {previews.length > 0 && (
          <div className={`gap-2 mb-4 ${previews.length === 1 ? 'flex justify-center' : 'grid grid-cols-2'}`}>
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className={`relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 ${
                  previews.length === 1 ? 'max-w-md' : ''
                }`}
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-40 object-contain"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-90"
                  disabled={posting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Character count */}
        {content.length > 0 && (
          <div className="flex justify-end mb-2">
            <span className={`text-xs ${content.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
              {content.length} / 280
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
          {/* Image Icon Button */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={posting || files.length >= 4}
            />
            <label
              htmlFor="file-upload"
              className={`text-gray-500 hover:text-purple-600 transition duration-150 cursor-pointer inline-flex items-center ${
                posting || files.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Image className="h-6 w-6" />
              {files.length > 0 && (
                <span className="ml-1 text-xs font-medium">{files.length}/4</span>
              )}
            </label>
          </div>

          <button
            onClick={createPost}
            disabled={posting || !content.trim() || content.length > 280}
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-150 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
          >
            {posting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CreatePost;