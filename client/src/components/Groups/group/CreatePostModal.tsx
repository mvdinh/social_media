import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Users as UsersIcon, MapPin, Smile, MoreHorizontal } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
  };
}

export function CreatePostModal({ onClose, user }: CreatePostModalProps) {
  const [postText, setPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    // Logic đăng bài
    console.log({ postText, selectedImages, isAnonymous });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2>Tạo bài viết</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{user.name}</span>
                <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors">
                  <span>Nhóm công khai</span>
                  <span>▼</span>
                </button>
              </div>
            </div>
          </div>

          {/* Anonymous Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-gray-700">Đăng ẩn danh</span>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isAnonymous ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  isAnonymous ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              ></div>
            </button>
          </div>

          {/* Text Input */}
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Tạo bài viết công khai..."
            className="w-full min-h-[120px] resize-none outline-none text-lg"
            autoFocus
          />

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg p-2">
              <div className={`grid gap-2 ${
                selectedImages.length === 1 ? 'grid-cols-1' : 
                selectedImages.length === 2 ? 'grid-cols-2' : 
                selectedImages.length === 3 ? 'grid-cols-3' : 
                'grid-cols-2'
              }`}>
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to Post */}
          <div className="mt-4 border border-gray-300 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Thêm vào bài viết của bạn</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Ảnh/Video"
              >
                <ImageIcon className="w-5 h-5 text-green-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Gắn thẻ người khác"
              >
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Vị trí"
              >
                <MapPin className="w-5 h-5 text-red-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Cảm xúc"
              >
                <Smile className="w-5 h-5 text-yellow-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Thêm"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handlePost}
            disabled={!postText.trim() && selectedImages.length === 0}
            className={`w-full py-2.5 rounded-lg transition-colors ${
              postText.trim() || selectedImages.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Đăng
          </button>
        </div>
      </div>
    </div>
  );
}
