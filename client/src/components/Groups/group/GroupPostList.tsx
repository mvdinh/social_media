import React from 'react';
import { Toaster } from 'sonner';
import { useAuth1 } from '../../../context/Context';
import { ListPost } from './PostGroup/ListPost';
import { usePostGroup } from '../../../hooks/usePostGroup';

interface GroupPostListProps {
  groupId: number;
}

export const GroupPostList: React.FC<GroupPostListProps> = ({ groupId }) => {
  const { user, contracts } = useAuth1();
  const address = user?.address 
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
  } = usePostGroup({
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