import { useState, useRef } from 'react';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';

interface UseCreatePostOptions {
  groupId?: number;
  onSuccess?: () => void;
}

enum MediaType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  MIXED = 3
}

export const useCreatePost = ({ groupId, onSuccess }: UseCreatePostOptions) => {
  const [showModal, setShowModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Để hiển thị preview ảnh
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HELPER: DETECT MEDIA TYPE ---
  // Trả về String để gửi lên Backend
  const detectMediaTypeString = (files: File[]): string => {
    if (files.length === 0) return "TEXT";
    let hasImage = false;
    let hasVideo = false;

    files.forEach(file => {
      if (file.type.startsWith('image/')) hasImage = true;
      else if (file.type.startsWith('video/')) hasVideo = true;
    });

    if (hasImage && hasVideo) return "MIXED";
    if (hasVideo) return "VIDEO";
    return "IMAGE";
  };

  const openModal = () => setShowModal(true);
  
  const closeModal = () => {
    setShowModal(false);
    setPostText('');
    setSelectedFiles([]);
    // Cleanup URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach(file => {
      // Validate
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`File ${file.name} không hỗ trợ`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---
  const handleCreatePost = async () => {
    if (!postText.trim() && selectedFiles.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc chọn ảnh!');
      return;
    }

    setIsCreating(true);
    const loadingToast = toast.loading('Đang đăng bài...');

    try {
      const formData = new FormData();
      formData.append('content', postText.trim());
      
      // Backend cần chuỗi 'IMAGE', 'VIDEO'...
      const mediaTypeStr = detectMediaTypeString(selectedFiles);
      formData.append('type', mediaTypeStr);

      // Append files
      // Tên field 'storyFile' phải khớp với uploadMiddleware.array("storyFile") ở backend
      selectedFiles.forEach((file) => {
        formData.append('storyFile', file);
      });

      if (groupId) {
        formData.append('groupId', groupId.toString());
      }

      await axiosClient.post('/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Đăng bài thành công!', { id: loadingToast });
      closeModal();
      
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Create post error:', error);
      toast.error('Đăng bài thất bại', { id: loadingToast });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    showModal,
    openModal,
    closeModal,
    
    postText,
    setPostText,
    selectedFiles,
    selectedImages: previewUrls, // Map lại tên biến để khớp UI cũ
    
    handleImageSelect,
    removeImage,
    handleCreatePost,
    
    isCreating,
    fileInputRef,
    
    canPost: (postText.trim().length > 0 || selectedFiles.length > 0) && !isCreating
  };
};