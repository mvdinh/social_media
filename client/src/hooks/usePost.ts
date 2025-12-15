import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import { useSocket } from '../context/SocketContext';
import { getTimeAgo } from '../utils/getTimeAgo';
import { Post, Comment, MediaType } from '../types/post';

export const usePosts = (groupId?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { socket } = useSocket();

  // --------------------------------------------------------
  // MAP API → UI
  // --------------------------------------------------------
  const mapPostData = (p: any): Post => {
    let mediaType = MediaType.TEXT;
    if (p.mediaType === 'VIDEO') mediaType = MediaType.VIDEO;
    else if (p.mediaType === 'IMAGE') mediaType = MediaType.IMAGE;
    else if (p.mediaType === 'MIXED') mediaType = MediaType.MIXED;

    const mediaUrls: string[] = Array.isArray(p.mediaUrls) ? p.mediaUrls : [];

    return {
      id: p._id,
      author: p.owner?.address || p.owner,
      authorName: p.owner?.username || 'Người dùng',
      avatar:
        p.owner?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.owner?._id || 'default'}`,
      content: p.content || '',
      mediaUrls,
      mediaType,
      likes: p.likesCount || 0,
      isLiked: p.isLikedByCurrentUser || false,
      commentsCount: p.commentsCount || 0,
      timestamp: new Date(p.createdAt).getTime(),
      time: getTimeAgo(new Date(p.createdAt).getTime()),
      isDeleted: p.isDeleted || false,
      comments: []
    };
  };

  // --------------------------------------------------------
  // FETCH POSTS
  // --------------------------------------------------------
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);

      const url = groupId ? `/groups/${groupId}/posts` : '/posts';
      const res = await axiosClient.get(url);

      const formatted = res.data.map(mapPostData);
      setPosts(formatted);
      console.log('Bảng tin đã được tải', formatted);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Không thể tải bảng tin');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // --------------------------------------------------------
  // SOCKET LISTENERS
  // --------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    const onNewPost = (data: any) => {
      const post = mapPostData(data);
      post.time = 'Vừa xong';
      setPosts(prev => [post, ...prev]);
    };

    const onLikeUpdate = ({ postId, likesCount }: any) => {
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, likes: likesCount } : p))
      );
    };

    const onCommentCount = ({ postId, count }: any) => {
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, commentsCount: count } : p))
      );
    };

    const onNewComment = ({ postId, comment }: any) => {
      if (!selectedPost || selectedPost.id !== postId) return;

      const newComment: Comment = {
        id: comment._id,
        author: comment.owner?.address || comment.owner,
        authorName: comment.owner?.username || 'User',
        avatar:
          comment.owner?.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.owner?._id || 'default'}`,
        content: comment.content,
        timestamp: Date.now(),
        time: 'Vừa xong'
      };

      setSelectedPost(prev =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, newComment],
              commentsCount: prev.commentsCount + 1
            }
          : null
      );
    };

    socket.on('new_post', onNewPost);
    socket.on('update_post_reaction', onLikeUpdate);
    socket.on('update_post_comment_count', onCommentCount);
    socket.on('new_comment', onNewComment);

    return () => {
      socket.off('new_post', onNewPost);
      socket.off('update_post_reaction', onLikeUpdate);
      socket.off('update_post_comment_count', onCommentCount);
      socket.off('new_comment', onNewComment);
    };
  }, [socket, selectedPost]);

  // --------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------
  const handleLike = async (postId: string) => {
    const backup = posts;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1
            }
          : p
      )
    );

    try {
      await axiosClient.post(`/posts/${postId}/like`);
    } catch {
      setPosts(backup);
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost({ ...post, comments: [] });

    try {
      const res = await axiosClient.get(`/posts/${post.id}/comments`);
      const comments: Comment[] = res.data.map((c: any) => ({
        id: c._id,
        author: c.owner?.address || c.owner,
        authorName: c.owner?.username || 'User',
        avatar:
          c.owner?.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.owner?._id || 'default'}`,
        content: c.content,
        timestamp: new Date(c.createdAt).getTime(),
        time: getTimeAgo(new Date(c.createdAt).getTime())
      }));

      setSelectedPost(prev => (prev ? { ...prev, comments } : null));
    } catch {
      toast.error('Không tải được bình luận');
    }
  };

  const handleCloseComments = () => {
    setSelectedPost(null);
    setCommentText('');
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    setIsSubmittingComment(true);
    try {
      await axiosClient.post(`/posts/${selectedPost.id}/comment`, {
        content: commentText.trim()
      });
      setCommentText('');
    } catch {
      toast.error('Lỗi gửi bình luận');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    loading,
    selectedPost,
    commentText,
    setCommentText,
    isSubmittingComment,
    loadPosts,
    handleLike,
    handleOpenComments,
    handleCloseComments,
    handleAddComment
  };
};