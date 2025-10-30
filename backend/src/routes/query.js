import express from 'express';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Share from '../models/Share.js';
import ipfsService from '../services/ipfsService.js';

const router = express.Router();

// ===============================================
// Get All Posts (Timeline)
// ===============================================
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, author } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = author ? { author: author.toLowerCase() } : {};

    const posts = await Post.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting posts:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// ===============================================
// Get Single Post with Full Details
// ===============================================
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { includeContent = false } = req.query;

    const post = await Post.findOne({ 
      blockchainId: Number(postId) 
    }).lean();

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Optionally fetch IPFS content
    let content = null;
    if (includeContent === 'true' && post.contentHash) {
      try {
        content = await ipfsService.getJSON(post.contentHash);
      } catch (err) {
        console.error('Error fetching IPFS content:', err);
      }
    }

    // Get comment count
    const commentCount = await Comment.countDocuments({ 
      postId: Number(postId) 
    });

    res.json({
      ...post,
      commentCount,
      content
    });

  } catch (error) {
    console.error('Error getting post:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// ===============================================
// Get Post Content from IPFS
// ===============================================
router.get('/post/:postId/content', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({ 
      blockchainId: Number(postId) 
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Fetch from IPFS
    const content = await ipfsService.getJSON(post.contentHash);

    res.json({
      success: true,
      contentHash: post.contentHash,
      content
    });

  } catch (error) {
    console.error('Error getting post content:', error);
    res.status(500).json({ error: 'Failed to get post content' });
  }
});

// ===============================================
// Get Comments for a Post
// ===============================================
router.get('/post/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50, includeContent = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({ 
      postId: Number(postId) 
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Optionally fetch IPFS content for each comment
    if (includeContent === 'true') {
      for (let comment of comments) {
        try {
          comment.content = await ipfsService.getJSON(comment.contentHash);
        } catch (err) {
          console.error('Error fetching comment content:', err);
          comment.content = null;
        }
      }
    }

    const total = await Comment.countDocuments({ 
      postId: Number(postId) 
    });

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// ===============================================
// Get Likes for a Post
// ===============================================
router.get('/post/:postId/likes', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 100 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const likes = await Like.find({ 
      postId: Number(postId) 
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Like.countDocuments({ 
      postId: Number(postId) 
    });

    res.json({
      likes,
      count: total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ error: 'Failed to get likes' });
  }
});

// ===============================================
// Check if User Liked a Post
// ===============================================
router.get('/post/:postId/liked/:user', async (req, res) => {
  try {
    const { postId, user } = req.params;

    const like = await Like.findOne({ 
      postId: Number(postId),
      user: user.toLowerCase()
    });

    res.json({
      liked: !!like,
      timestamp: like?.timestamp
    });

  } catch (error) {
    console.error('Error checking like:', error);
    res.status(500).json({ error: 'Failed to check like' });
  }
});

// ===============================================
// Get Shares for a Post
// ===============================================
router.get('/post/:postId/shares', async (req, res) => {
  try {
    const { postId } = req.params;

    const shares = await Share.find({ 
      postId: Number(postId) 
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({
      shares,
      count: shares.length
    });

  } catch (error) {
    console.error('Error getting shares:', error);
    res.status(500).json({ error: 'Failed to get shares' });
  }
});

// ===============================================
// Get Posts by Author
// ===============================================
router.get('/user/:address/posts', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find({ 
      author: address.toLowerCase() 
    })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Post.countDocuments({ 
      author: address.toLowerCase() 
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ error: 'Failed to get user posts' });
  }
});

// ===============================================
// Get User Stats
// ===============================================
router.get('/user/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    const lowerAddress = address.toLowerCase();

    const postCount = await Post.countDocuments({ author: lowerAddress });
    const likeCount = await Like.countDocuments({ user: lowerAddress });
    const commentCount = await Comment.countDocuments({ author: lowerAddress });
    const shareCount = await Share.countDocuments({ user: lowerAddress });

    // Get total likes received on user's posts
    const userPosts = await Post.find({ author: lowerAddress }, 'blockchainId');
    const postIds = userPosts.map(p => p.blockchainId);
    const likesReceived = await Like.countDocuments({ 
      postId: { $in: postIds } 
    });

    res.json({
      address: lowerAddress,
      postCount,
      likeCount,
      commentCount,
      shareCount,
      likesReceived
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// ===============================================
// Search Posts by Content Hash
// ===============================================
router.get('/search', async (req, res) => {
  try {
    const { contentHash, author, mediaType } = req.query;

    const filter = {};
    
    if (contentHash) filter.contentHash = contentHash;
    if (author) filter.author = author.toLowerCase();
    if (mediaType !== undefined) filter.mediaType = parseInt(mediaType);

    const posts = await Post.find(filter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      posts,
      count: posts.length
    });

  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// ===============================================
// Get Latest Posts (Real-time Feed)
// ===============================================
router.get('/feed/latest', async (req, res) => {
  try {
    const { limit = 20, since } = req.query;

    const filter = since ? { 
      timestamp: { $gt: new Date(since) } 
    } : {};

    const posts = await Post.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      posts,
      count: posts.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error getting latest posts:', error);
    res.status(500).json({ error: 'Failed to get latest posts' });
  }
});

// ===============================================
// Get Trending Posts (by likes/shares)
// ===============================================
router.get('/feed/trending', async (req, res) => {
  try {
    const { limit = 20, period = 24 } = req.query;

    // Get posts from last X hours
    const since = new Date(Date.now() - parseInt(period) * 60 * 60 * 1000);

    const posts = await Post.find({
      timestamp: { $gt: since }
    })
      .sort({ likes: -1, shares: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      posts,
      count: posts.length,
      period: `${period}h`
    });

  } catch (error) {
    console.error('Error getting trending posts:', error);
    res.status(500).json({ error: 'Failed to get trending posts' });
  }
});

export default router;