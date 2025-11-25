import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CommentModal } from './CommentModal';
import { useAuth } from '../../context/AuthContext';
import { getFromIpfs, uploadTextToIpfs } from '../../helper/UploadToIpfs';
import { toast, Toaster } from 'sonner';
import { Post, Comment } from '../../types/post';

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// Component hiển thị nhiều ảnh dạng Grid
const ImageGrid = ({ mediaHashes }: { mediaHashes: string[] }) => {
  if (!mediaHashes || mediaHashes.length === 0) return null;

  const imageCount = mediaHashes.length;

  // 1 ảnh: full width với tỷ lệ tự nhiên
  if (imageCount === 1) {
    return (
      <div className="w-full bg-gray-100">
        <img 
          src={`${IPFS_GATEWAY}${mediaHashes[0]}`} 
          alt="Post media" 
          className="w-full h-auto object-contain max-h-[600px]"
          loading="lazy"
        />
      </div>
    );
  }

  // 2 ảnh: 2 cột với chiều cao cố định
  if (imageCount === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100">
        {mediaHashes.map((hash, idx) => (
          <div key={idx} className="relative overflow-hidden" style={{ paddingBottom: '100%' }}>
            <img 
              src={`${IPFS_GATEWAY}${hash}`} 
              alt={`Media ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3 ảnh: 1 ảnh lớn bên trái, 2 ảnh nhỏ bên phải
  if (imageCount === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
        <div className="relative overflow-hidden">
          <img 
            src={`${IPFS_GATEWAY}${mediaHashes[0]}`} 
            alt="Main media"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          <div className="relative overflow-hidden">
            <img 
              src={`${IPFS_GATEWAY}${mediaHashes[1]}`} 
              alt="Media 2"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="relative overflow-hidden">
            <img 
              src={`${IPFS_GATEWAY}${mediaHashes[2]}`} 
              alt="Media 3"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // 4+ ảnh: Grid 2x2, với badge hiển thị số ảnh còn lại
  return (
    <div className="grid grid-cols-2 gap-1 bg-gray-100" style={{ height: '400px' }}>
      {mediaHashes.slice(0, 4).map((hash, idx) => (
        <div key={idx} className="relative overflow-hidden">
          <img 
            src={`${IPFS_GATEWAY}${hash}`} 
            alt={`Media ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {idx === 3 && imageCount > 4 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer hover:bg-opacity-70 transition-all">
              <span className="text-white text-3xl font-bold">
                +{imageCount - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ListPost = () => {
  const { address, contracts } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');
  
  const postContract = contracts["socialMedia"];

  // Convert Proxy object to plain array
  const convertProxyToArray = (proxyData: any): any[] => {
    if (!proxyData) return [];
    
    // Nếu đã là array thì return luôn
    if (Array.isArray(proxyData)) return proxyData;
    
    // Convert Proxy/Object thành array
    const result = [];
    let index = 0;
    
    while (proxyData[index] !== undefined) {
      result.push(proxyData[index]);
      index++;
    }
    
    return result;
  };

  // --- HÀM MỚI: Chỉ tải và giải mã comment cho 1 bài viết cụ thể ---
  const refreshCurrentPostComments = async (postId: number): Promise<Comment[]> => {
    if (!postContract) {
      console.log("No contract available");
      return [];
    }

    try {
      console.log(`=== DEBUG: Getting comments for post ${postId} ===`);
      
      // 1. Lấy danh sách comment raw từ blockchain
      const rawComments = await postContract.getComments(postId);
      console.log("Raw comments from contract (Proxy):", rawComments);
      
      // 2. Convert Proxy sang Array thường
      const comments = convertProxyToArray(rawComments);
      console.log("Converted comments array:", comments);
      console.log("Comments length:", comments.length);

      // Kiểm tra cấu trúc dữ liệu
      if (comments && comments.length > 0) {
        console.log("First comment structure:", comments[0]);
        console.log("First comment properties:", {
          author: comments[0].author || comments[0][0],
          contentHash: comments[0].contentHash || comments[0][1],
          mediaHash: comments[0].mediaHash || comments[0][2],
          timestamp: comments[0].timestamp || comments[0][3],
          isDeleted: comments[0].isDeleted !== undefined ? comments[0].isDeleted : comments[0][4]
        });
      }

      const parsedComments: Comment[] = [];

      // 3. Duyệt và giải mã IPFS
      for (let i = 0; i < comments.length; i++) {
        const rawComment = comments[i];
        console.log(`Processing comment ${i}:`, rawComment);
        
        // Extract properties từ struct (hỗ trợ cả named và indexed access)
        const comment = {
          author: rawComment.author || rawComment[0],
          contentHash: rawComment.contentHash || rawComment[1],
          mediaHash: rawComment.mediaHash || rawComment[2],
          timestamp: rawComment.timestamp || rawComment[3],
          isDeleted: rawComment.isDeleted !== undefined ? rawComment.isDeleted : rawComment[4]
        };
        
        console.log(`Extracted comment ${i}:`, comment);
        
        // Kiểm tra comment có tồn tại và không bị xóa
        if (comment && !comment.isDeleted && comment.contentHash && comment.contentHash !== '') {
          try {
            console.log(`Decoding IPFS for comment ${i}, hash: ${comment.contentHash}`);
            
            // Lấy nội dung text từ IPFS
            const commentContent = await getFromIpfs(comment.contentHash);
            console.log(`Decoded comment content:`, commentContent);
            
            parsedComments.push({
              author: comment.author,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`,
              content: commentContent,
              contentHash: comment.contentHash,
              mediaHash: comment.mediaHash || '',
              timestamp: Number(comment.timestamp),
              isDeleted: comment.isDeleted
            });
          } catch (err) {
            console.error(`Lỗi giải mã IPFS cho comment ${i}:`, err);
            parsedComments.push({
              author: comment.author,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`,
              content: "Không thể tải nội dung bình luận",
              contentHash: comment.contentHash,
              mediaHash: comment.mediaHash || '',
              timestamp: Number(comment.timestamp),
              isDeleted: comment.isDeleted
            });
          }
        } else {
          console.log(`Comment ${i} is invalid, deleted or empty:`, comment);
        }
      }

      console.log(`Final parsed comments for post ${postId}:`, parsedComments);
      return parsedComments;
    } catch (error) {
      console.error("Lỗi khi tải comment riêng lẻ:", error);
      return [];
    }
  };

  // Load tất cả bài viết (Initial Load)
  const loadPosts = async () => {
    if (!postContract) {
      console.log("Contract not available");
      return;
    }

    try {
      setLoading(true);
      const postCount = await postContract.postCount();
      console.log("Total posts:", postCount.toString());

      if (postCount.toString() === "0") {
        setPosts([]);
        setLoading(false);
        return;
      }

      const loadedPosts: Post[] = [];

      for (let i = Number(postCount); i >= 1; i--) {
        try {
          const postData = await postContract.getPost(i);
          console.log(`Raw post data ${i}:`, postData);
          
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
            console.log(`Post ${i} is deleted or has no content, skipping`);
            continue;
          }

          // Giải mã nội dung từ IPFS
          const content = await getFromIpfs(post.contentHash);
          console.log(`Post ${i} content from IPFS:`, content);

          // Convert mediaHashes từ Proxy sang Array
          const mediaHashesArray = convertProxyToArray(post.mediaHashes);
          console.log(`Post ${i} media hashes:`, mediaHashesArray);

          let mediaUrl = undefined;
          if (mediaHashesArray && mediaHashesArray.length > 0) {
            mediaUrl = `${IPFS_GATEWAY}${mediaHashesArray[0]}`;
          }

          const isLiked = address ? await postContract.checkIfLiked(i, address) : false;

          // Sử dụng hàm refreshCurrentPostComments để tải comments với IPFS decoding
          const comments = await refreshCurrentPostComments(i);
          console.log(`Post ${i} comments after processing:`, comments);

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
          console.error(`Error loading post ${i}:`, error);
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

  const getTimeAgo = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(timestamp * 1000).toLocaleDateString('vi-VN');
  };

  const handleLike = async (postId: number) => {
    if (!postContract || !address) {
      toast.error('Vui lòng kết nối ví!');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      if (post.isLiked) {
        const tx = await postContract.unlikePost(postId);
        toast.loading('Đang bỏ thích...', { id: 'like-toast' });
        await tx.wait();
        toast.success('Đã bỏ thích!', { id: 'like-toast' });
        
        setPosts(prev => prev.map(p => p.id === postId ? {...p, isLiked: false, likes: p.likes - 1} : p));
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? {...prev, isLiked: false, likes: prev.likes - 1} : null);
        }

      } else {
        const tx = await postContract.likePost(postId);
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

  const handleOpenComments = async (post: Post) => {
    // Khi mở modal, refresh comments để đảm bảo có dữ liệu mới nhất
    const refreshedComments = await refreshCurrentPostComments(post.id);
    setSelectedPost({
      ...post,
      comments: refreshedComments
    });
  };

  const handleCloseComments = () => {
    setSelectedPost(null);
    setCommentText('');
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost || !postContract || !address) {
      toast.error('Vui lòng nhập nội dung bình luận!');
      return;
    }

    try {
      toast.loading('Đang thêm bình luận...', { id: 'comment-toast' });

      console.log("=== DEBUG: Starting add comment process ===");
      console.log("Post ID:", selectedPost.id);
      console.log("Comment text:", commentText);

      // 1. Upload lên IPFS
      const commentHash = await uploadTextToIpfs(commentText);
      console.log('Comment IPFS Hash:', commentHash);

      // 2. Gửi transaction
      console.log("Sending transaction...");
      const tx = await postContract.addComment(selectedPost.id, commentHash);
      console.log("Transaction sent:", tx.hash);
      
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      console.log("Transaction status:", receipt.status);

      toast.success('Đã thêm bình luận!', { id: 'comment-toast' });
      setCommentText('');

      // 3. Đợi một chút để blockchain update
      console.log("Waiting for blockchain update...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Tải lại comments với dữ liệu đã giải mã IPFS
      console.log("Refreshing comments...");
      const newComments = await refreshCurrentPostComments(selectedPost.id);
      console.log("New comments after adding:", newComments);

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
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        data: error.data
      });
      
      if (error.code === 4001) {
        toast.error('Bạn đã từ chối giao dịch', { id: 'comment-toast' });
      } else {
        toast.error('Không thể thêm bình luận', { id: 'comment-toast' });
      }
    }
  };

  useEffect(() => {
    if (postContract) {
      loadPosts();
    }
  }, [postContract, address]);

  // Lắng nghe sự kiện CommentAdded
  useEffect(() => {
    if (!postContract || !selectedPost) return;

    const filter = postContract.filters.CommentAdded(selectedPost.id);
    const handleNewComment = () => {
      console.log("New comment detected, refreshing comments...");
      refreshCurrentPostComments(selectedPost.id).then(newComments => {
        setSelectedPost(prev => prev ? { ...prev, comments: newComments } : null);
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === selectedPost.id ? { ...p, comments: newComments } : p
          )
        );
      });
    };

    postContract.on(filter, handleNewComment);
    return () => {
      postContract.off(filter, handleNewComment);
    };
  }, [postContract, selectedPost]);

  // Lắng nghe sự kiện PostCreated
  useEffect(() => {
    if (!postContract) return;
    const filter = postContract.filters.PostCreated();
    const handleNewPost = () => {
      console.log("New post detected, reloading...");
      loadPosts();
    };
    postContract.on(filter, handleNewPost);
    return () => {
      postContract.off(filter, handleNewPost);
    };
  }, [postContract]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" richColors />

      <div className="max-w-2xl mx-auto py-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Chưa có bài viết nào. Hãy tạo bài viết đầu tiên!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm mb-4">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover"/>
                  <div>
                    <div className="font-semibold text-sm">
                      {post.author.slice(0, 6)}...{post.author.slice(-4)}
                    </div>
                    <div className="text-gray-500 text-sm">{post.time}</div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Images - Sử dụng ImageGrid component */}
              <ImageGrid mediaHashes={post.mediaHashes} />

              {/* Stats */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200">
                <div className="text-gray-600 text-sm">{post.likes} lượt thích</div>
                <div className="text-gray-600 text-sm">{post.comments.length} bình luận</div>
              </div>

              {/* Actions */}
              <div className="px-4 py-2 flex items-center justify-around">
                <motion.button
                  onClick={() => handleLike(post.id)}
                  whileTap={{ scale: 0.9 }}
                  disabled={!address}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    post.isLiked ? 'text-blue-600' : 'text-gray-600'
                  } ${!address ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <motion.div
                    animate={post.isLiked ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                  <span>Thích</span>
                </motion.button>
                <button
                  onClick={() => handleOpenComments(post)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Bình luận</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPost && (
        <CommentModal
          post={selectedPost}
          commentText={commentText}
          onClose={handleCloseComments}
          onLike={handleLike}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
          userAddress={address}
        />
      )}
    </div>
  );
};

export default ListPost;