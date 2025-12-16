import { X, Image as ImageIcon, Users as UsersIcon, MapPin, Smile, MoreHorizontal, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
  };
  postText: string;
  setPostText: (text: string) => void;
  selectedImages: string[];
  isAnonymous: boolean;
  setIsAnonymous: (value: boolean) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleCreatePost: () => void;
  isCreating: boolean;
  canPost: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  groupName?: string; // Nếu có thì hiển thị tên group
}

export function CreatePostModal({
  onClose,
  user,
  postText,
  setPostText,
  selectedImages,
  isAnonymous,
  setIsAnonymous,
  handleImageSelect,
  removeImage,
  handleCreatePost,
  isCreating,
  canPost,
  fileInputRef,
}: CreatePostModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tạo bài viết</h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
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
                <span className="font-semibold">{user.name}</span>
                <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors">
                  <span>{ 'Nhóm công khai'}</span>
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
              disabled={isCreating}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isAnonymous ? 'bg-blue-600' : 'bg-gray-300'
              } ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            placeholder={`Viết gì đó trong ...` 
              
            }
            className="w-full min-h-[120px] resize-none outline-none text-lg"
            disabled={isCreating}
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
                      disabled={isCreating}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50"
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
              <span className="text-sm font-medium">Thêm vào bài viết của bạn</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleImageSelect}
                disabled={isCreating}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isCreating}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Ảnh/Video"
              >
                <ImageIcon className="w-5 h-5 text-green-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Gắn thẻ người khác"
                disabled={isCreating}
              >
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Vị trí"
                disabled={isCreating}
              >
                <MapPin className="w-5 h-5 text-red-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Cảm xúc"
                disabled={isCreating}
              >
                <Smile className="w-5 h-5 text-yellow-600" />
              </button>
              <button
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Thêm"
                disabled={isCreating}
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreatePost}
            disabled={!canPost}
            className={`w-full py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold ${
              canPost
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating && <Loader2 className="w-5 h-5 animate-spin" />}
            <span>{isCreating ? 'Đang đăng...' : 'Đăng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}