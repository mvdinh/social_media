import React from 'react';
import { Toaster } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../hooks/usePost';
import { ListPost } from '../components/Post/ListPost';
import CreatePost from '../components/Post/CreatePost';
import { CreatePostBox } from '../components/Post/CreatePostBox';

const ListPostPage = () => {
  const { address, contracts } = useAuth();
  const postContract = contracts?.["socialMedia"];

  const {
    posts,
    loading,
    selectedPost,
    commentText,
    setCommentText,
    handleLike,
    handleOpenComments,
    handleCloseComments,
    handleAddComment
  } = usePosts({
    contract: postContract,
    address: address,
    // Không truyền groupId => Load tất cả posts
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" richColors />
          
      <div className="max-w-2xl mx-auto py-4">
        <div className='pb-4'>
          <CreatePostBox />
        </div>
        <ListPost
          posts={posts}
          loading={loading}
          selectedPost={selectedPost}
          commentText={commentText}
          userAddress={address}
          onLike={handleLike}
          onOpenComments={handleOpenComments}
          onCloseComments={handleCloseComments}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
        />
      </div>
    </div>
  );
};

export default ListPostPage;