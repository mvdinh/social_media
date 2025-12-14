import { useState, useRef } from 'react';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';

interface UseCreatePostOptions {
  groupId?: number;
  onSuccess?: () => void;
}

export const useCreatePost = ({ groupId, onSuccess }: UseCreatePostOptions) => {
  const [showModal, setShowModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================
  // MEDIA TYPE
  // =========================
  const detectMediaTypeString = (files: File[]): string => {
    if (files.length === 0) return 'TEXT';

    let hasImage = false;
    let hasVideo = false;

    files.forEach(file => {
      if (file.type.startsWith('image/')) hasImage = true;
      else if (file.type.startsWith('video/')) hasVideo = true;
    });

    if (hasImage && hasVideo) return 'MIXED';
    if (hasVideo) return 'VIDEO';
    return 'IMAGE';
  };

  // =========================
  // MODAL
  // =========================
  const openModal = () => setShowModal(true);

  const closeModal = () => {
    setShowModal(false);
    setPostText('');
    setSelectedFiles([]);

    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =========================
  // FILE SELECT
  // =========================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name}: Chỉ hỗ trợ ảnh và video`);
        continue;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: File quá lớn (tối đa 50MB)`);
        continue;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    }

    if (selectedFiles.length + validFiles.length > 10) {
      toast.error('Tối đa 10 ảnh/video');
      previews.forEach(URL.revokeObjectURL);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // =========================
  // SUBMIT
  // =========================
  // =========================
// SUBMIT
// =========================
const handleCreatePost = async () => {
  if (!postText.trim() && selectedFiles.length === 0) {
    toast.error('Vui lòng nhập nội dung hoặc chọn ảnh/video!');
    return;
  }

  setIsCreating(true);
  const toastId = toast.loading('Đang upload IPFS và đăng bài...');

  try {
    const formData = new FormData();

    // =========================
    // 🔐 USER ADDRESS (BẮT BUỘC)
    // =========================
    const userAddress = localStorage.getItem('userAddress');
    if (!userAddress) {
      throw new Error('User address not found');
    }
    formData.append('userAddress', userAddress);

    // =========================
    // CONTENT
    // =========================
    if (postText.trim()) {
      formData.append('content', postText.trim());
    }

    // =========================
    // MEDIA TYPE
    // =========================
    formData.append('type', detectMediaTypeString(selectedFiles));

    // =========================
    // FILES (MULTER FIELD NAME)
    // =========================
    selectedFiles.forEach(file => {
      formData.append('files', file); // ✔ đúng field
    });

    // group post (optional)
    if (groupId !== undefined) {
      formData.append('groupId', groupId.toString());
    }

    await axiosClient.post('/posts/create', formData, {
      timeout: 180000,
    });

    toast.success('Đăng bài thành công!', { id: toastId });
    closeModal();
    onSuccess?.();

  } catch (error: any) {
    console.error(error);

    let message = 'Đăng bài thất bại';

    if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message === 'User address not found') {
      message = 'Bạn chưa đăng nhập hoặc ví chưa kết nối';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Upload quá lâu. File lớn hoặc mạng chậm.';
    }

    toast.error(message, { id: toastId });
  } finally {
    setIsCreating(false);
  }
};


  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // =========================
  return {
    showModal,
    openModal,
    closeModal,

    postText,
    setPostText,

    selectedFiles,
    selectedImages: previewUrls, // ✔ GIỮ NGUYÊN
    previewUrls,

    handleImageSelect,
    removeImage,
    triggerFileInput,
    handleCreatePost,

    isCreating,
    fileInputRef,

    canPost:
      (postText.trim().length > 0 || selectedFiles.length > 0) && !isCreating,
    hasMedia: selectedFiles.length > 0,
    mediaCount: selectedFiles.length,
  };
};
