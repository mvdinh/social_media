import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import axiosClient from '../api/axiosClient';
import { useSocket } from '../context/SocketContext';
import { getTimeAgo } from '../utils/getTimeAgo';
import { Post, Comment, MediaType } from '../types/post'; 

export const usePosts = (groupId?: number) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý Modal Comment
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { socket } = useSocket();

  // --------------------------------------------------------
  // HELPER: MAP DATA TỪ API (MongoDB) SANG FRONTEND (UI)
  // --------------------------------------------------------
  const mapPostData = (p: any): Post => {
    // Convert Backend String Type ('IMAGE', 'VIDEO') -> Frontend Enum Number (0, 1, 2...)
    let mType = MediaType.TEXT;
    if (p.mediaType === 'VIDEO') mType = MediaType.VIDEO;
    else if (p.mediaType === 'IMAGE') mType = MediaType.IMAGE;
    else if (p.mediaType === 'MIXED') mType = MediaType.MIXED;

    return {
      id: p._id,
      // Xử lý author: Nếu backend populate thì lấy object, ko thì lấy string
      author: p.owner?.address || p.owner, 
      authorName: p.owner?.username || "Người dùng",
      avatar: p.owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.owner?._id || 'default'}`,
      
      content: p.content,
      // Map mediaUrls từ DB vào mediaHashes của UI cũ để không vỡ layout
      mediaHashes: p.mediaUrls || [], 
      image: p.mediaUrls?.[0] || null, // Ảnh cover (ảnh đầu tiên)
      mediaType: mType,
      
      likes: p.likesCount || 0,
      isLiked: p.isLikedByCurrentUser || false,
      commentsCount: p.commentsCount || 0,
      
      timestamp: new Date(p.createdAt).getTime(),
      time: getTimeAgo(new Date(p.createdAt).getTime()),
      isDeleted: p.isDeleted,
      comments: [] // Comment sẽ load lazy sau
    };
  };

  // --------------------------------------------------------
  // 1. FETCH POSTS (API)
  // --------------------------------------------------------
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      // Endpoint chuẩn: /posts (hoặc /groups/:id/posts)
      const endpoint = groupId ? `/groups/${groupId}/posts` : '/posts';
      
      const response = await axiosClient.get(endpoint);
      
      // Map dữ liệu
      const formattedPosts = response.data.map(mapPostData);
      setPosts(formattedPosts);

    } catch (error) {
      console.error("Error loading posts:", error);
      toast.error("Không thể tải bảng tin");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // --------------------------------------------------------
  // 2. SOCKET REALTIME LISTENERS
  // --------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // A. Sự kiện: Có bài viết mới
    socket.on("new_post", (newPostData: any) => {
      // Chỉ xử lý nếu đang ở Feed chung hoặc đúng Group
      // (Nếu muốn filter kỹ hơn cần check groupId trong newPostData)
      const newPostFormatted = mapPostData(newPostData);
      newPostFormatted.time = "Vừa xong"; // Realtime nên set time luôn
      
      // Thêm bài mới vào đầu danh sách
      setPosts(prev => [newPostFormatted, ...prev]);
    });

    // B. Sự kiện: Cập nhật lượt Like
    socket.on("update_post_reaction", ({ postId, likesCount }: any) => {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, likes: likesCount } : p
      ));
    });

    // C. Sự kiện: Cập nhật số lượng Comment (ở ngoài Feed)
    socket.on("update_post_comment_count", ({ postId, count }: any) => {
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, commentsCount: count } : p
      ));
    });

    // D. Sự kiện: Có Comment mới (chỉ xử lý khi đang mở Modal của bài đó)
    socket.on("new_comment", ({ postId, comment }: any) => {
      if (selectedPost && selectedPost.id === postId) {
        const newCmt: Comment = {
           id: comment._id,
           author: comment.owner.address || comment.owner,
           authorName: comment.owner.username || "User",
           avatar: comment.owner.avatar,
           content: comment.content,
           timestamp: Date.now(),
           time: "Vừa xong"
        };
        // Thêm comment vào list hiện tại trong Modal
        setSelectedPost(prev => prev ? { ...prev, comments: [...prev.comments, newCmt] } : null);
      }
    });

    // Cleanup listeners
    return () => {
      socket.off("new_post");
      socket.off("update_post_reaction");
      socket.off("update_post_comment_count");
      socket.off("new_comment");
    };
  }, [socket, selectedPost]);

  // --------------------------------------------------------
  // 3. USER ACTIONS
  // --------------------------------------------------------

  // --- LIKE POST ---
  const handleLike = async (postId: string) => {
    // 1. Optimistic Update (Cập nhật UI trước khi gọi API)
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));

    // 2. Gọi API
    try {
      await axiosClient.post(`/posts/${postId}/like`);
      // Socket sẽ lo việc đồng bộ cho người khác
    } catch (error) {
      console.error("Like error:", error);
      toast.error("Lỗi thao tác");
      loadPosts(); // Rollback lại dữ liệu cũ nếu lỗi
    }
  };

  // --- OPEN COMMENTS (Load chi tiết comment) ---
  const handleOpenComments = async (post: Post) => {
    setSelectedPost({ ...post, comments: [] }); // Mở modal ngay
    try {
      const res = await axiosClient.get(`/posts/${post.id}/comments`);
      
      const comments = res.data.map((c: any) => ({
        id: c._id,
        author: c.owner.address,
        authorName: c.owner.username || "User",
        avatar: c.owner.avatar,
        content: c.content,
        timestamp: new Date(c.createdAt).getTime(),
        time: getTimeAgo(new Date(c.createdAt).getTime())
      }));
      
      setSelectedPost(prev => prev ? { ...prev, comments } : null);
    } catch (error) {
      console.error("Load comments error", error);
      toast.error("Không tải được bình luận");
    }
  };

  // --- CLOSE COMMENTS ---
  const handleCloseComments = () => {
    setSelectedPost(null);
    setCommentText('');
  };

  // --- ADD COMMENT ---
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    
    setIsSubmittingComment(true);
    try {
      await axiosClient.post(`/posts/${selectedPost.id}/comment`, {
        content: commentText
      });
      
      setCommentText('');
      toast.success("Đã bình luận");
      // Socket sẽ lo việc push comment mới vào list
      
    } catch (error) {
      console.error("Add comment error:", error);
      toast.error("Lỗi gửi bình luận");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Load posts khi component mount
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