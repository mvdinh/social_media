import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js"; 
import { sendNotification } from "../utils/notificationHelper.js";

// ==========================================
// 1. CREATE POST
// ==========================================
export const createPost = async (req, res) => {
  try {
    const userAddress = req.user.address; 
    
    const user = await User.findOne({ address: userAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { content, type } = req.body;
    const files = req.files;

    let mediaUrls = [];
    if (files && files.length > 0) {
      mediaUrls = files.map(file => `http://localhost:3000/uploads/${file.filename}`);
    }

    if (!content && mediaUrls.length === 0) {
      return res.status(400).json({ error: "Content or Media required" });
    }

    const newPost = await Post.create({
      owner: user._id, 
      content,
      mediaUrls,
      mediaType: type || (mediaUrls.length > 0 ? "IMAGE" : "TEXT"),
      likes: [],
      likesCount: 0
    });

    await newPost.populate("owner", "address username avatar");

    req.io.emit("new_post", newPost);

    res.json({ success: true, post: newPost });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 2. GET POSTS (Private)
// ==========================================

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy domain hiện tại (Cấu hình trong .env hoặc hardcode localhost)
    // Định nghĩa prefix cho API xem ảnh
    const IPFS_VIEW_ENDPOINT = `http://localhost:3000/api/ipfs/view`;

    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "address username avatar")
      .lean();

    // Helper function để format URL
    const formatIpfsUrl = (cid) => {
        if (!cid) return null;
        if (cid.startsWith("http") || cid.startsWith("https")) return cid; // Đã là link thì giữ nguyên
        return `${IPFS_VIEW_ENDPOINT}/${cid}`; // Ghép CID vào endpoint
    };

    const formattedPosts = posts.map(p => {
      // 1. Xử lý mảng Media (Ảnh/Video bài viết)
      const processedMediaUrls = (p.mediaUrls || []).map(cid => formatIpfsUrl(cid));

      // 2. Xử lý Avatar của người đăng (nếu avatar cũng lưu IPFS)
      const processedOwner = {
          ...p.owner,
          avatar: formatIpfsUrl(p.owner?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.owner?._id}`
      };

      return {
        ...p,
        mediaUrls: processedMediaUrls, // Trả về Full URL
        owner: processedOwner,         // Trả về Owner với Full Avatar URL
        isLikedByCurrentUser: req.user ? p.likes.includes(req.user.address) : false
      };
    });

    res.json(formattedPosts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 3. TOGGLE LIKE
// ==========================================
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userAddress = req.user.address;

    const post = await Post.findById(postId).populate("owner", "address"); 
    
    if (!post || post.isDeleted) return res.status(404).json({ error: "Post not found" });

    const index = post.likes.indexOf(userAddress);
    let isLiked = false;

    if (index === -1) {
      post.likes.push(userAddress);
      post.likesCount += 1;
      isLiked = true;

      // Check null cho owner để tránh crash nếu user đã bị xóa
      if (post.owner && post.owner.address !== userAddress) {
        await sendNotification({
          req,
          recipient: post.owner.address,
          sender: userAddress,
          type: "LIKE_POST",
          postId: post._id,
          message: `đã thích bài viết của bạn.`
        });
      }
    } else {
      post.likes.splice(index, 1);
      post.likesCount -= 1;
    }

    await post.save();

    req.io.emit("update_post_reaction", {
      postId: post._id,
      likesCount: post.likesCount
    });

    res.json({ success: true, likesCount: post.likesCount, isLiked });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 4. ADD COMMENT
// ==========================================
export const addComment = async (req, res) => {
  try {
    const userAddress = req.user.address;
    const user = await User.findOne({ address: userAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId).populate("owner", "address");
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = await Comment.create({
      postId,
      owner: user._id, 
      content
    });

    await newComment.populate("owner", "address username avatar");

    post.commentsCount += 1;
    await post.save();

    if (post.owner && post.owner.address !== userAddress) {
      await sendNotification({
        req,
        recipient: post.owner.address,
        sender: userAddress,
        type: "COMMENT_POST",
        postId: post._id,
        message: `đã bình luận: "${content.substring(0, 20)}..."`
      });
    }

    req.io.emit("new_comment", {
      postId,
      comment: newComment
    });
    
    req.io.emit("update_post_comment_count", {
      postId,
      count: post.commentsCount
    });

    res.json({ success: true, comment: newComment });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 5. GET COMMENTS (Private)
// ==========================================
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate("owner", "address username avatar");
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};