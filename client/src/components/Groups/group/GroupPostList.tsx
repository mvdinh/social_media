import React from 'react';
import { Toaster } from 'sonner';
import { useAuth } from '../../../context/AuthContext';
import { ListPost } from '../../Post/ListPost';
import { usePosts } from '../../../hooks/usePost';

interface GroupPostListProps {
  groupId: number;
}

export const GroupPostList: React.FC<GroupPostListProps> = ({ groupId }) => {
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];

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
    contract: groupContract,
    address: address,
    groupId: groupId 
  });

  return (
    <>
      <Toaster position="top-center" richColors />
      
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
    </>
  );
};