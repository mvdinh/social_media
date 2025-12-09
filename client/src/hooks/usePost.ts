import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getFromIpfs, uploadTextToIpfs } from '../services/ipfs.service';
import { Post, Comment } from '../types/post';
import { getTimeAgo } from '../utils/getTimeAgo';
import { convertProxyToArray } from '../utils/convertData';
import { refreshCurrentPostComments } from '../helper/PostHelper';

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

interface UsePostsOptions {
  contract: any;
  address: string | undefined;
  groupId?: number; // Nếu có groupId thì load posts của group, không thì load tất cả
}

export const usePosts = ({ contract, address, groupId }: UsePostsOptions) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');

 
  // Load posts (all or group-specific)
  const loadPosts = async () => {
    if (!contract) {
      console.log("Contract not available");
      return;
    }

    try {
      setLoading(true);
      let rawPosts: any[] = [];

      // Nếu có groupId thì lấy posts của group, không thì lấy tất cả
      if (groupId !== undefined) {
        console.log("Loading posts for group:", groupId);
        const groupPosts = await contract.getGroupPosts(groupId);
        rawPosts = convertProxyToArray(groupPosts);
      } else {
        console.log("Loading all posts");
        const postCount = await contract.postCount();
        console.log("Total posts:", postCount.toString());

        if (postCount.toString() === "0") {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Load từng post
        for (let i = Number(postCount); i >= 1; i--) {
          try {
            const postData = await contract.getPost(i);
            rawPosts.push(postData);
          } catch (error) {
            console.error(`Error loading post ${i}:`, error);
          }
        }
      }

      const loadedPosts: Post[] = [];

      // Parse từng post
      for (const postData of rawPosts) {
        try {
          const post = {
            id: postData.id || postData[0],
            author: postData.author || postData[1],
            contentHash: postData.contentHash || postData[2],
            mediaHashes: postData.mediaHashes || postData[3] || [],
            mediaType: postData.mediaType !== undefined ? postData.mediaType : postData[4],
            timestamp: postData.timestamp || postData[5],
            likes: postData.likes || postData[6],
            isDeleted: postData.isDeleted !== undefined ? postData.isDeleted : postData[7]
          };
          
          if (post.isDeleted || !post.contentHash) {
            continue;
          }

          // Giải mã nội dung từ IPFS
          const content = await getFromIpfs(post.contentHash);

          // Convert mediaHashes
          const mediaHashesArray = convertProxyToArray(post.mediaHashes);

          let mediaUrl = undefined;
          if (mediaHashesArray && mediaHashesArray.length > 0) {
            mediaUrl = `${IPFS_GATEWAY}${mediaHashesArray[0]}`;
          }

          const isLiked = address ? await contract.checkIfLiked(Number(post.id), address) : false;
          const comments = await (contract,Number(post.id));
          const timestamp = Number(post.timestamp);
          const timeAgo = getTimeAgo(timestamp);

          loadedPosts.push({
            id: Number(post.id),
            author: post.author,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author}`,
            time: timeAgo,
            content,
            contentHash: post.contentHash,
            mediaHashes: mediaHashesArray,
            mediaType: Number(post.mediaType),
            image: mediaUrl,
            likes: Number(post.likes),
            comments: comments,
            isLiked,
            timestamp,
            isDeleted: post.isDeleted
          });
        } catch (error) {
          console.error("Error parsing post:", error);
        }
      }

      setPosts(loadedPosts);
      console.log("All loaded posts:", loadedPosts);
    } catch (error: any) {
      console.error("Error loading posts:", error);
      toast.error("Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  // Handle like
  const handleLike = async (postId: number) => {
    if (!contract || !address) {
      toast.error('Vui lòng kết nối ví!');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      if (post.isLiked) {
        const tx = await contract.unlikePost(postId);
        toast.loading('Đang bỏ thích...', { id: 'like-toast' });
        await tx.wait();
        toast.success('Đã bỏ thích!', { id: 'like-toast' });
        
        setPosts(prev => prev.map(p => p.id === postId ? {...p, isLiked: false, likes: p.likes - 1} : p));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? {...prev, isLiked: false, likes: prev.likes - 1} : null);
        }
      } else {
        const tx = await contract.likePost(postId);
        toast.loading('Đang thích...', { id: 'like-toast' });
        await tx.wait();
        toast.success('Đã thích bài viết!', { id: 'like-toast' });

        setPosts(prev => prev.map(p => p.id === postId ? {...p, isLiked: true, likes: p.likes + 1} : p));
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? {...prev, isLiked: true, likes: prev.likes + 1} : null);
        }
      }
    } catch (error: any) {
      console.error("Error liking post:", error);
      if (error.code === 4001) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'like-toast' });
      } else {
        toast.error('Lỗi khi thực hiện thao tác', { id: 'like-toast' });
      }
    }
  };

  // Handle open comments
  const handleOpenComments = async (post: Post) => {
    const refreshedComments = await refreshCurrentPostComments(contract,post.id);
    setSelectedPost({
      ...post,
      comments: refreshedComments
    });
    
  };

  // Handle close comments
  const handleCloseComments = () => {
    setSelectedPost(null);
    setCommentText('');
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost || !contract || !address) {
      toast.error('Vui lòng nhập nội dung bình luận!');
      return;
    }

    try {
      toast.loading('Đang thêm bình luận...', { id: 'comment-toast' });

      const commentHash = await uploadTextToIpfs(commentText);
      const tx = await contract.addComment(selectedPost.id, commentHash);
      await tx.wait();

      toast.success('Đã thêm bình luận!', { id: 'comment-toast' });
      setCommentText('');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const newComments = await refreshCurrentPostComments(contract, selectedPost.id);

      if (newComments) {
        setSelectedPost(prev => prev ? {
          ...prev,
          comments: newComments
        } : null);

        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === selectedPost.id 
              ? { ...p, comments: newComments } 
              : p
          )
        );
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      
      if (error.code === 4001) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'comment-toast' });
      } else {
        toast.error('Không thể thêm bình luận', { id: 'comment-toast' });
      }
    }
  };

  // Load posts on mount or when dependencies change
  useEffect(() => {
    if (contract) {
      loadPosts();
    }
  }, [contract, address, groupId]);

  // Listen for new comments
  useEffect(() => {
    if (!contract || !selectedPost) return;

    const filter = contract.filters.CommentAdded(selectedPost.id);
    const handleNewComment = () => {
      console.log("New comment detected, refreshing comments...");
      refreshCurrentPostComments(contract,selectedPost.id).then(newComments => {
        setSelectedPost(prev => prev ? { ...prev, comments: newComments } : null);
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === selectedPost.id ? { ...p, comments: newComments } : p
          )
        );
      });
    };

    contract.on(filter, handleNewComment);
    return () => {
      contract.off(filter, handleNewComment);
    };
  }, [contract, selectedPost]);

  // Listen for new posts
  useEffect(() => {
    if (!contract) return;
    
    const filter = groupId !== undefined 
      ? contract.filters.GroupPostCreated(null, groupId)
      : contract.filters.PostCreated();
      
    const handleNewPost = () => {
      console.log("New post detected, reloading...");
      loadPosts();
    };
    
    contract.on(filter, handleNewPost);
    return () => {
      contract.off(filter, handleNewPost);
    };
  }, [contract, groupId]);

  return {
    posts,
    loading,
    selectedPost,
    commentText,
    setCommentText,
    handleLike,
    handleOpenComments,
    handleCloseComments,
    handleAddComment,
    loadPosts
  };
};