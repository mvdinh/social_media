import { Image, X, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { uploadTextToIpfs, uploadMultipleFilesToIpfs } from "../../helper/UploadToIpfs";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";

const CreatePost = () => {
  const acc = {
    name: "John Warren",
    handle: "@john_warren",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40",
  };

  const { address, contracts } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const postContract = contracts["socialMedia"];

  useEffect(() => {
    console.log("postContract", postContract);
    console.log("address", address);
  }, [postContract, address]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).slice(0, 4 - files.length);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => [...prev, e.target.result as string]);
        }
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
    if (!postContract || !content?.trim()) {
      toast.error('Vui lòng viết nội dung bài viết!');
      return;
    }

    if (!address) {
      toast.error('Vui lòng kết nối ví!');
      return;
    }

    setPosting(true);

    let contentHash = '';
    let mediaHashes: string[] = [];
    let mediaType = 0; // 0 = TEXT, 1 = IMAGE, 2 = VIDEO, 3 = MIXED

    try {
      // === STEP 1: Upload text content to IPFS ===
      try {
        contentHash = await uploadTextToIpfs(content);
        console.log('✅ Content CID:', contentHash);
      } catch (ipfsTextError: any) {
        console.error('❌ Failed to upload text content:', ipfsTextError);
        throw new Error(`Không thể tải nội dung lên IPFS: ${ipfsTextError.message || ipfsTextError}`);
      }

      // === STEP 2: Upload media files to IPFS (if any) ===
      if (Array.isArray(files) && files.length > 0) {
        console.log(`📤 Step 2: Uploading ${files.length} media files to IPFS...`);
        try {
          mediaHashes = await uploadMultipleFilesToIpfs(files);
          console.log('✅ Media CIDs:', mediaHashes);

          // Determine media type
          const hasImage = files.some(f => f.type.startsWith('image/'));
          const hasVideo = files.some(f => f.type.startsWith('video/'));

          if (hasImage && hasVideo) mediaType = 3; // MIXED
          else if (hasVideo) mediaType = 2; // VIDEO
          else mediaType = 1; // IMAGE
        } catch (ipfsMediaError: any) {
          console.error('❌ Failed to upload media files:', ipfsMediaError);
          throw new Error(`Không thể tải media lên IPFS: ${ipfsMediaError.message || ipfsMediaError}`);
        }
      }

      // === STEP 3: Create post on blockchain ===
      console.log('📝 Step 3: Creating post on blockchain...');
      let tx;
      
      try {
        if (mediaHashes.length > 0) {
          console.log('Calling createPostWithMedia...');
          tx = await postContract.createPostWithMedia(contentHash, mediaHashes, mediaType);
        } else {
          console.log('Calling createPost...');
          tx = await postContract.createPost(contentHash);
        }
        console.log('✅ Transaction sent:', tx.hash);
      } catch (txError: any) {
        console.error('❌ Transaction error:', txError);
        
        if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
          throw new Error('Bạn đã từ chối giao dịch');
        }
        
        if (txError.message?.includes('user rejected')) {
          throw new Error('Giao dịch bị từ chối bởi người dùng');
        }
        
        throw new Error(`Giao dịch thất bại: ${txError.message || 'Lỗi không xác định'}`);
      }

      // === STEP 4: Wait for confirmation ===
      console.log('⏳ Step 4: Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Show success toast
      toast.success('Tạo bài viết thành công!');

      // Reset form
      setContent('');
      setFiles([]);
      setPreviews([]);

      // Reload page to show new post
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
      console.error('❌ Error creating post (full trace):', error);
      
      let errorMessage = 'Không thể tạo bài viết';
      
      if (error.message?.includes('IPFS')) {
        errorMessage = `${error.message}\n\nHãy chắc chắn IPFS Desktop đang chạy!`;
      } else if (error.message?.includes('từ chối')) {
        errorMessage = 'Giao dịch đã bị từ chối';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 p-4 md:p-8">
      <Toaster position="top-center" richColors />
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
            <p className="text-gray-800 font-semibold text-sm">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
            <p className="text-gray-500 text-xs">{acc.handle}</p>
          </div>
        </div>

        {/* TEXTAREA FOR POST CONTENT */}
        <div className="py-2">
          <textarea
            className="w-full resize-none border-none focus:outline-none text-gray-700 placeholder-gray-400 text-lg"
            rows={3}
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={posting}
          />
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
              accept="image/*,video/*"
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