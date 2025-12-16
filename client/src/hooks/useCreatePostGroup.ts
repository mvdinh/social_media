import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { uploadTextToIpfs, uploadMultipleFilesToIpfs } from '../services/ipfs.service';

interface UseCreatePostOptions {
  contract: any;
  address: string | undefined;
  groupId?: number;
  onSuccess?: () => void;
}

// MediaType enum (phải khớp với contract)
enum MediaType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  MIXED = 3
}

export const useCreatePostGroup = ({ contract, address, groupId, onSuccess }: UseCreatePostOptions) => {
  const [showModal, setShowModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect media type from files
  const detectMediaType = (files: File[]): MediaType => {
    if (files.length === 0) return MediaType.TEXT;

    let hasImage = false;
    let hasVideo = false;

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        hasImage = true;
      } else if (file.type.startsWith('video/')) {
        hasVideo = true;
      }
    });

    // Nếu có cả ảnh và video
    if (hasImage && hasVideo) {
      return MediaType.MIXED;
    }
    
    // Chỉ có video
    if (hasVideo) {
      return MediaType.VIDEO;
    }
    
    // Chỉ có ảnh
    if (hasImage) {
      return MediaType.IMAGE;
    }

    return MediaType.TEXT;
  };

  // Open modal
  const openModal = () => {
    setShowModal(true);
  };

  // Close modal and reset
  const closeModal = () => {
    setShowModal(false);
    setPostText('');
    setSelectedImages([]);
    setSelectedFiles([]);
    setIsAnonymous(false);
  };

  // Handle image select
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    const validFiles: File[] = [];
    const previews: string[] = [];

    fileArray.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`File ${file.name} không được hỗ trợ. Chỉ chấp nhận ảnh và video.`);
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setSelectedImages(prev => [...prev, ...previews]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postText.trim() && selectedFiles.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return;
    }

    if (!contract || !address) {
      toast.error('Vui lòng kết nối ví!');
      return;
    }

    setIsCreating(true);
    const loadingToast = toast.loading('Đang tạo bài viết...');

    try {
      // Step 1: Upload text content to IPFS
      toast.loading('Đang tải nội dung lên IPFS...', { id: loadingToast });
      const contentHash = await uploadTextToIpfs(postText.trim() || 'Bài viết có ảnh/video');
      console.log('✅ Content uploaded to IPFS:', contentHash);

      // Step 2: Upload media to IPFS (if any)
      let mediaHashes: string[] = [];
      let mediaType = MediaType.TEXT;

      if (selectedFiles.length > 0) {
        toast.loading(`Đang tải ${selectedFiles.length} file lên IPFS...`, { id: loadingToast });
        mediaHashes = await uploadMultipleFilesToIpfs(selectedFiles);
        console.log('✅ Media uploaded to IPFS:', mediaHashes);
        
        // Detect media type
        mediaType = detectMediaType(selectedFiles);
        console.log('📊 Detected media type:', MediaType[mediaType]);
      }

      // Step 3: Create post on blockchain
      toast.loading('Đang tạo bài viết trên blockchain...', { id: loadingToast });

      let tx;
      
      if (groupId !== undefined) {
        // Tạo post trong group
        console.log('Creating group post for group:', groupId);
        if (mediaHashes.length > 0) {
          tx = await contract.createGroupPostWithMedia(
            groupId,
            contentHash,
            mediaHashes,
            mediaType
          );
        } else {
          tx = await contract.createGroupPost(groupId, contentHash);
        }
      } else {
        // Tạo post bình thường
        console.log('Creating normal post');
        if (mediaHashes.length > 0) {
          tx = await contract.createPostWithMedia(
            contentHash,
            mediaHashes,
            mediaType
          );
        } else {
          tx = await contract.createPost(contentHash);
        }
      }

      console.log('📝 Transaction sent:', tx.hash);
      toast.loading('Đang chờ xác nhận...', { id: loadingToast });
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      toast.success('Đã đăng bài viết thành công! 🎉', { id: loadingToast });

      // Close modal and reset
      closeModal();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      
      let errorMessage = 'Tạo bài viết thất bại';
      
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Bạn đã từ chối giao dịch';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Số dư không đủ để thực hiện giao dịch';
      } else if (error.message?.includes('Cannot connect to IPFS')) {
        errorMessage = 'Không thể kết nối IPFS. Vui lòng kiểm tra IPFS Desktop';
      } else if (error.message?.includes('Invalid media type')) {
        errorMessage = 'Loại file không hợp lệ';
      } else if (error.reason) {
        errorMessage = error.reason;
      }

      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    // Modal state
    showModal,
    openModal,
    closeModal,
    
    // Post data
    postText,
    setPostText,
    selectedImages,
    selectedFiles,
    isAnonymous,
    setIsAnonymous,
    
    // Actions
    handleImageSelect,
    removeImage,
    handleCreatePost,
    
    // UI state
    isCreating,
    fileInputRef,
    
    // Computed
    canPost: (postText.trim().length > 0 || selectedFiles.length > 0) && !isCreating
  };
};