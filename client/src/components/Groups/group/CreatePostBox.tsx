import { useState } from 'react';
import { FileText, BarChart3, Smile } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';

export function CreatePostBox() {
  const [showModal, setShowModal] = useState(false);
  
  const currentUser = {
    name: 'Mai Văn Định',
    avatar: 'https://i.pravatar.cc/150?img=12',
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2.5 text-left text-gray-500 transition-colors"
          >
            Bạn viết gì đi...
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <FileText className="w-5 h-5" />
            <span>Bài viết ẩn danh</span>
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <BarChart3 className="w-5 h-5" />
            <span>Thăm dò ý kiến</span>
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <Smile className="w-5 h-5" />
            <span>Cảm xúc/hoạt động</span>
          </button>
        </div>
      </div>

      {showModal && (
        <CreatePostModal onClose={() => setShowModal(false)} user={currentUser} />
      )}
    </>
  );
}
