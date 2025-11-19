import React, { useState } from 'react';
import { ThumbsUp, MessageCircle, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { CommentModal } from './CommentModal';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
}

const ListPost = () =>{
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Theanh28 Entertainment',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      time: '31 phút',
      content: 'Team Quang Linh Vlogs vỡ òa vàng chảy đến cổng toà để nhìn thấy xe gỡ Quang Linh Vlogs, và mong được nhìn thấy tận mắt Quang Linh do chị vai giảy.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
      likes: 3500,
      comments: [
        {
          id: 1,
          author: 'Trần Văn An',
          avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
          content: 'Giống Jiso quá emm tui 😂 Hiền Anh',
          time: '1 ngày',
          likes: 12
        },
        {
          id: 2,
          author: 'Thanh Hằng',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          content: 'Xinh iu hãy đê tóc này',
          time: '1 ngày',
          likes: 8
        }
      ],
      isLiked: false
    },
    {
      id: 2,
      author: 'Minh Tuấn',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
      time: '2 giờ',
      content: 'Một ngày mới tràn đầy năng lượng! Hãy cùng nhau cố gắng và hoàn thành những mục tiêu đã đề ra nhé các bạn!',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop',
      likes: 1240,
      comments: [
        {
          id: 1,
          author: 'Lan Anh',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
          content: 'Cảm ơn anh đã chia sẻ!',
          time: '1 giờ',
          likes: 5
        }
      ],
      isLiked: false
    },
    {
      id: 3,
      author: 'Nguyễn Hương',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      time: '5 giờ',
      content: 'Cuối tuần này mình sẽ đi du lịch Đà Lạt. Có ai có kinh nghiệm cho mình xin tips với ạ!',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
      likes: 892,
      comments: [],
      isLiked: false
    }
  ]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleOpenComments = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseComments = () => {
    setSelectedPost(null);
    setCommentText('');
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    const newComment: Comment = {
      id: selectedPost.comments.length + 1,
      author: 'Bạn',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      content: commentText,
      time: 'Vừa xong',
      likes: 0
    };

    setPosts(posts.map(post => {
      if (post.id === selectedPost.id) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setSelectedPost({
      ...selectedPost,
      comments: [...selectedPost.comments, newComment]
    });

    setCommentText('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-blue-600">Bảng tin</h1>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-2xl mx-auto py-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm mb-4">
            {/* Post Header */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={post.avatar}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span>{post.author}</span>
                    <span className="text-blue-500">✓</span>
                  </div>
                  <div className="text-gray-500 text-sm">{post.time}</div>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p>{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="w-full">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Post Stats */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200">
              <div className="text-gray-600 text-sm">
                {post.likes.toLocaleString()} lượt thích
              </div>
              <div className="text-gray-600 text-sm">
                {post.comments.length} bình luận
              </div>
            </div>

            {/* Post Actions */}
            <div className="px-4 py-2 flex items-center justify-around">
              <motion.button
                onClick={() => handleLike(post.id)}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  post.isLiked ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <motion.div
                  animate={post.isLiked ? {
                    scale: [1, 1.3, 1],
                    rotate: [0, -10, 10, 0]
                  } : {}}
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
        ))}
      </div>

      {/* Comments Modal */}
      {selectedPost && (
        <CommentModal
          post={selectedPost}
          commentText={commentText}
          onClose={handleCloseComments}
          onLike={handleLike}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}

export default ListPost;