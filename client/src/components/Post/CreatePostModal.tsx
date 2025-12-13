import React from 'react';
import { X, Image as ImageIcon, Users as UsersIcon, MapPin, Smile, MoreHorizontal, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
  user: {
    name: string;
    avatar: string;
  };
  postText: string;
  setPostText: (text: string) => void;
  selectedImages: string[]; // URL preview
  isAnonymous: boolean;
  setIsAnonymous: (value: boolean) => void;
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleCreatePost: () => void;
  isCreating: boolean;
  canPost: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CreatePostModal({
  onClose,
  user,
  postText,
  setPostText,
  selectedImages,
  handleImageSelect,
  removeImage,
  handleCreatePost,
  isCreating,
  canPost,
  fileInputRef,
}: CreatePostModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between relative">
          <h2 className="text-xl font-bold text-center w-full">Tạo bài viết</h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="absolute right-3 top-3 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh]">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
            <div>
                <span className="font-semibold block text-gray-900">{user.name}</span>
                <div className="bg-gray-200 px-2 py-0.5 rounded text-xs font-medium text-gray-700 inline-block mt-0.5">
                    Công khai
                </div>
            </div>
          </div>

          {/* Text Input */}
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={`${user.name} ơi, bạn đang nghĩ gì thế?`}
            className="w-full min-h-[120px] resize-none outline-none text-lg text-gray-800 placeholder:text-gray-400"
            disabled={isCreating}
            autoFocus
          />

          {/* Image Preview */}
          {selectedImages.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg p-2 relative">
               <button 
                  onClick={() => { /* Logic clear all images if needed */ }}
                  className="absolute top-2 right-2 z-10 bg-white p-1 rounded-full shadow-sm"
               >
                  <X className="w-4 h-4"/>
               </button>
              <div className={`grid gap-1 ${
                selectedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={image}
                      alt={`Preview ${index}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-700" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to Post Panel */}
          <div className="mt-4 border border-gray-300 rounded-lg p-3 flex items-center justify-between shadow-sm">
            <span className="text-sm font-semibold text-gray-700">Thêm vào bài viết</span>
            <div className="flex items-center gap-1">
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
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-green-500"
                title="Ảnh/Video"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-blue-500">
                <UsersIcon className="w-6 h-6" />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-yellow-500">
                <Smile className="w-6 h-6" />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-red-500">
                <MapPin className="w-6 h-6" />
              </button>
              <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleCreatePost}
            disabled={!canPost}
            className={`w-full py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm ${
              canPost
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isCreating ? 'Đang đăng...' : 'Đăng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}