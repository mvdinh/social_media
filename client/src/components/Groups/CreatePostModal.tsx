import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Smile } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  onCreatePost: (content: string, images?: string[]) => void;
  userAvatar?: string;
  userName?: string;
  groupName: string;
}

export function CreatePostModal({ onClose, onCreatePost, userAvatar, userName, groupName }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const newPreviews: string[] = [];

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === fileArray.length) {
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!content.trim() && imagePreviews.length === 0) return;
    onCreatePost(content, imagePreviews.length > 0 ? imagePreviews : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl">Tạo bài viết</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full bg-gray-300"
              style={{
                backgroundImage: userAvatar ? `url(${userAvatar})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div>
              <p className="font-medium">{userName || 'Người dùng'}</p>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>Đang đăng trong</span>
                <span className="font-medium text-gray-900">{groupName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Text Input */}
          <div className="p-4">
            <textarea
              placeholder="Bạn viết gì đi..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[120px] outline-none resize-none text-lg"
              autoFocus
            />
          </div>

          {/* Images Preview */}
          {imagePreviews.length > 0 && (
            <div className="px-4 pb-4">
              <div className={`grid gap-2 ${
                imagePreviews.length === 1 ? 'grid-cols-1' :
                imagePreviews.length === 2 ? 'grid-cols-2' :
                imagePreviews.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className={`w-full object-cover ${
                        imagePreviews.length === 1 ? 'max-h-[400px]' :
                        imagePreviews.length <= 3 ? 'h-48' :
                        'h-40'
                      }`}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {imagePreviews.length} ảnh đã chọn
              </p>
            </div>
          )}

          {/* Add to Post */}
          <div className="px-4 pb-4">
            <div className="border border-gray-300 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Thêm vào bài viết của bạn</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 p-2 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Ảnh/Video"
                >
                  <ImageIcon size={24} className="text-green-500" />
                </button>
                <button
                  className="flex-1 p-2 flex items-center justify-center gap-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Cảm xúc/Hoạt động"
                >
                  <Smile size={24} className="text-yellow-500" />
                </button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handlePost}
            disabled={!content.trim() && imagePreviews.length === 0}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Đăng
          </button>
        </div>
      </div>
    </div>
  );
}