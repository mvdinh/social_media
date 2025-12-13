import React from 'react';
import { Toaster } from 'sonner';
import { useAuth1 } from '../context/Context'; // Import Auth Context mới
import { usePosts } from '../hooks/usePost';
import { ListPost } from '../components/Post/ListPost';
import { CreatePostBox } from '../components/Post/CreatePostBox';

const ListPostPage = () => {
  // Lấy user từ AuthContext mới (để lấy address truyền vào ListPost)
  const { user } = useAuth1();

  // Gọi Hook usePosts không tham số => Mặc định load feed chung
  const {
    posts,
    loading,
    selectedPost,
    commentText,
    setCommentText,
    handleLike,
    handleOpenComments,
    handleCloseComments,
    handleAddComment,
    isSubmittingComment // Thêm state loading khi comment
  } = usePosts(); 

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" richColors />
          
      <div className="max-w-2xl mx-auto py-4">
        {/* Box tạo bài viết */}
        <div className='pb-4'>
          <CreatePostBox />
        </div>

        {/* Danh sách bài viết */}
        <ListPost
          posts={posts}
          loading={loading}
          selectedPost={selectedPost}
          commentText={commentText}
          userAddress={user?.address} // Truyền address để check quyền like/comment
          onLike={handleLike}
          onOpenComments={handleOpenComments}
          onCloseComments={handleCloseComments}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
          isSubmittingComment={isSubmittingComment}
        />
      </div>
    </div>
  );
};

export default ListPostPage;