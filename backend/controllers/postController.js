import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { sendNotification } from "../utils/notificationHelper.js";
import { uploadFileToIPFS, getIPFSMetadata } from "../services/ipfs.service.js";
import { IPFS_CONFIG } from "../config/ipfs.js";
import fs from "fs";

// ==========================================
// 1. CREATE POST
// ==========================================
export const createPost = async (req, res) => {
  try {
    const isFormData = !!req.files;

    // ✅ CHỈ LẤY 1 NGUỒN
    const body = isFormData ? req.body : req.body;

    const userAddress = isFormData
      ? req.body.userAddress
      : req.user?.address;

    if (!userAddress) {
      return res.status(400).json({ error: "User address is required" });
    }

    const user = await User.findOne({ address: userAddress });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { content, type } = body;
    const files = isFormData ? req.files : [];

    let mediaCids = [];

    // =========================
    // UPLOAD IPFS
    // =========================
    if (files.length > 0) {
      console.log(`📤 Uploading ${files.length} file(s) to IPFS...`);

      for (const file of files) {
        const cid = await uploadFileToIPFS(file.path);
        mediaCids.push(cid);
        fs.unlinkSync(file.path);
      }
    }

    // =========================
    // VALIDATE
    // =========================
    if (!content && mediaCids.length === 0) {
      return res.status(400).json({ error: "Content or Media required" });
    }

    // =========================
    // SAVE POST
    // =========================
    const newPost = await Post.create({
      owner: user._id,
      content: content || "",
      mediaUrls: mediaCids,
      mediaType: type || (mediaCids.length > 0 ? "IMAGE" : "TEXT"),
      likes: [],
      likesCount: 0,
      commentsCount: 0
    });

    await newPost.populate("owner", "address username avatar");

    // =========================
    // FORMAT RESPONSE
    // =========================
    const formattedPost = {
      ...newPost.toObject(),
      mediaUrls: mediaCids.map(cid => `${IPFS_CONFIG.GATEWAY_URL}/${cid}`),
      owner: {
        ...newPost.owner.toObject(),
        avatar: newPost.owner.avatar?.startsWith("http")
          ? newPost.owner.avatar
          : newPost.owner.avatar
            ? `${IPFS_CONFIG.GATEWAY_URL}/${newPost.owner.avatar}`
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${newPost.owner._id}`
      },
      isLikedByCurrentUser: false
    };

    req.io.emit("new_post", formattedPost);

    res.json({ success: true, post: formattedPost });

  } catch (err) {
    console.error("Create post error:", err);

    if (req.files) {
      req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
    }

    res.status(500).json({ error: err.message });
  }
};


// ==========================================
// 2. GET POSTS
// ==========================================
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Lấy posts từ DB (mediaUrls chứa CID)
    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("owner", "address username avatar")
      .lean();

    const currentUserAddress = req.user?.address;

    // ✅ GỌI getIPFSMetadata ĐỂ VERIFY & LẤY IPFS URL
    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        // Verify và lấy URLs cho media
        const processedMediaUrls = await Promise.all(
          (post.mediaUrls || []).map(async (cid) => {
            try {
              // Gọi getIPFSMetadata để verify CID tồn tại
              const metadata = await getIPFSMetadata(cid);
              
              // Nếu metadata là dữ liệu binary (ảnh/video), trả về Gateway URL
              return `${IPFS_CONFIG.GATEWAY_URL}/${cid}`;
              
            } catch (error) {
              console.warn(`⚠️ Cannot fetch IPFS data for CID: ${cid}`);
              // Fallback: vẫn trả Gateway URL
              return `${IPFS_CONFIG.GATEWAY_URL}/${cid}`;
            }
          })
        );

        // Xử lý avatar
        let ownerAvatar;
        if (post.owner?.avatar) {
          try {
            await getIPFSMetadata(post.owner.avatar);
            ownerAvatar = `${IPFS_CONFIG.GATEWAY_URL}/${post.owner.avatar}`;
          } catch (error) {
            ownerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.owner._id}`;
          }
        } else {
          ownerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.owner?._id || 'default'}`;
        }

        // Check like status
        const isLikedByCurrentUser = currentUserAddress 
          ? post.likes.some(likeAddr => likeAddr === currentUserAddress)
          : false;

        return {
          ...post,
          mediaUrls: processedMediaUrls, // Gateway URLs đã verify
          owner: {
            ...post.owner,
            avatar: ownerAvatar
          },
          isLikedByCurrentUser
        };
      })
    );

    res.json(formattedPosts);

  } catch (err) {
    console.error("Get posts error:", err);
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
    
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    const index = post.likes.indexOf(userAddress);
    let isLiked = false;

    if (index === -1) {
      post.likes.push(userAddress);
      post.likesCount += 1;
      isLiked = true;

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

    res.json({
      success: true,
      likesCount: post.likesCount,
      isLiked
    });

  } catch (err) {
    console.error("Toggle like error:", err);
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
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { postId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content required" });
    }

    const post = await Post.findById(postId).populate("owner", "address");
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newComment = await Comment.create({
      postId,
      owner: user._id,
      content: content.trim()
    });

    await newComment.populate("owner", "address username avatar");

    post.commentsCount += 1;
    await post.save();

    // Format comment với IPFS avatar
    let commentAvatar;
    if (newComment.owner.avatar) {
      try {
        await getIPFSMetadata(newComment.owner.avatar);
        commentAvatar = `${IPFS_CONFIG.GATEWAY_URL}/${newComment.owner.avatar}`;
      } catch (error) {
        commentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newComment.owner._id}`;
      }
    } else {
      commentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newComment.owner._id}`;
    }

    const formattedComment = {
      ...newComment.toObject(),
      owner: {
        ...newComment.owner.toObject(),
        avatar: commentAvatar
      }
    };

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
      comment: formattedComment
    });

    req.io.emit("update_post_comment_count", {
      postId,
      count: post.commentsCount
    });

    res.json({
      success: true,
      comment: formattedComment
    });

  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 5. GET COMMENTS
// ==========================================
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ 
      postId, 
      isDeleted: false 
    })
      .sort({ createdAt: 1 })
      .populate("owner", "address username avatar")
      .lean();

    // Format comments với IPFS verification
    const formattedComments = await Promise.all(
      comments.map(async (comment) => {
        let commentAvatar;
        
        if (comment.owner.avatar) {
          try {
            await getIPFSMetadata(comment.owner.avatar);
            commentAvatar = `${IPFS_CONFIG.GATEWAY_URL}/${comment.owner.avatar}`;
          } catch (error) {
            commentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.owner._id}`;
          }
        } else {
          commentAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.owner._id || 'default'}`;
        }

        return {
          ...comment,
          owner: {
            ...comment.owner,
            avatar: commentAvatar
          }
        };
      })
    );

    res.json(formattedComments);

  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: err.message });
  }
};