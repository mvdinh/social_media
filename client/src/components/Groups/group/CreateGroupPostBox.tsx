import { FileText, BarChart3, Smile } from 'lucide-react';
import { CreatePostModal } from '../../Post/CreatePostModal';
import { useAuth } from '../../../context/AuthContext';
import { useCreatePost } from '../../../hooks/useCreatePost';
import { useParams } from 'react-router-dom';



export function CreateGroupPostBox() {
  const { id } = useParams();
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];
  
  const currentUser = {
    name: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
  };

  const {
    showModal,
    openModal,
    closeModal,
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
    fileInputRef
  } = useCreatePost({
    contract: groupContract,
    address: address,
    groupId: id, // Truyền groupId => Tạo post trong group
    onSuccess: () => {
      console.log('Group post created successfully!');
    }
  });

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
            onClick={openModal}
            className="flex-1 bg-gray-100 hover:bg-gray-200 rounded-full px-4 py-2.5 text-left text-gray-500 transition-colors"
          >
            Viết gì đó trong ...
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
          <button 
            onClick={openModal}
            className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600"
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Bài viết ẩn danh</span>
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">Thăm dò ý kiến</span>
          </button>
          
          <button className="flex-1 flex items-center justify-center gap-2 py-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-600">
            <Smile className="w-5 h-5" />
            <span className="text-sm">Cảm xúc/hoạt động</span>
          </button>
        </div>
      </div>

      {showModal && (
        <CreatePostModal
          onClose={closeModal}
          user={currentUser}
          postText={postText}
          setPostText={setPostText}
          selectedImages={selectedImages}
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          handleImageSelect={handleImageSelect}
          removeImage={removeImage}
          handleCreatePost={handleCreatePost}
          isCreating={isCreating}
          canPost={canPost}
          fileInputRef={fileInputRef}
        />
      )}
    </>
  );
}