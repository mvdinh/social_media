
import {Post } from "../models/Post.js";
import {ipfsService} from "../services/ipfsService.js";
import express from "express";
const router = express.Router();

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  "event PostCreated(uint256 indexed postId, address indexed author, string contentHash, uint8 mediaType)",
  "event PostLiked(uint256 indexed postId, address indexed user)",
  "event PostUnliked(uint256 indexed postId, address indexed user)",
  "event PostShared(uint256 indexed postId, address indexed user)",
  "event CommentAdded(uint256 indexed postId, address indexed author, string contentHash)",
  "event PostMintedAsNFT(uint256 indexed postId, uint256 indexed tokenId, address indexed owner)",
  "function getPost(uint256 _postId) public view returns (tuple(uint256 id, address author, string contentHash, string[] mediaHashes, uint8 mediaType, uint256 timestamp, uint256 likes, uint256 shares, uint256 nftTokenId, bool isNFT))",
  "function getComments(uint256 _postId) public view returns (tuple(address author, string contentHash, string mediaHash, uint256 timestamp)[])",
  "function postCount() public view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// ===============================================
// Sync Single Post from Blockchain
// ===============================================
router.post('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const blockchainPost = await contract.getPost(postId);

    if (blockchainPost.id.toString() === '0') {
      return res.status(404).json({ error: 'Post not found on blockchain' });
    }

    // Check if already exists
    let post = await Post.findOne({ blockchainId: Number(postId) });

    if (!post) {
      post = new Post({
        blockchainId: Number(postId),
        author: blockchainPost.author.toLowerCase(),
        contentHash: blockchainPost.contentHash,
        mediaHashes: blockchainPost.mediaHashes,
        mediaType: blockchainPost.mediaType,
        timestamp: new Date(Number(blockchainPost.timestamp) * 1000),
        likes: Number(blockchainPost.likes),
        shares: Number(blockchainPost.shares),
        isNFT: blockchainPost.isNFT,
        nftTokenId: Number(blockchainPost.nftTokenId),
        txHash: req.body.txHash || ''
      });
    } else {
      // Update existing
      post.likes = Number(blockchainPost.likes);
      post.shares = Number(blockchainPost.shares);
      post.isNFT = blockchainPost.isNFT;
      post.nftTokenId = Number(blockchainPost.nftTokenId);
    }

    await post.save();

    res.json({
      success: true,
      post,
      message: 'Post synced successfully'
    });

  } catch (error) {
    console.error('Error syncing post:', error);
    res.status(500).json({ error: 'Failed to sync post' });
  }
});

// ===============================================
// Sync All Posts from Blockchain
// ===============================================
router.post('/posts/all', async (req, res) => {
  try {
    const postCount = await contract.postCount();
    const total = Number(postCount);

    let synced = 0;
    let errors = 0;

    for (let i = 1; i <= total; i++) {
      try {
        const blockchainPost = await contract.getPost(i);
        
        let post = await Post.findOne({ blockchainId: i });

        if (!post) {
          post = new Post({
            blockchainId: i,
            author: blockchainPost.author.toLowerCase(),
            contentHash: blockchainPost.contentHash,
            mediaHashes: blockchainPost.mediaHashes,
            mediaType: blockchainPost.mediaType,
            timestamp: new Date(Number(blockchainPost.timestamp) * 1000),
            likes: Number(blockchainPost.likes),
            shares: Number(blockchainPost.shares),
            isNFT: blockchainPost.isNFT,
            nftTokenId: Number(blockchainPost.nftTokenId),
            txHash: ''
          });
        } else {
          post.likes = Number(blockchainPost.likes);
          post.shares = Number(blockchainPost.shares);
          post.isNFT = blockchainPost.isNFT;
          post.nftTokenId = Number(blockchainPost.nftTokenId);
        }

        await post.save();
        synced++;
      } catch (err) {
        console.error(`Error syncing post ${i}:`, err);
        errors++;
      }
    }

    res.json({
      success: true,
      total,
      synced,
      errors,
      message: `Synced ${synced}/${total} posts`
    });

  } catch (error) {
    console.error('Error syncing all posts:', error);
    res.status(500).json({ error: 'Failed to sync posts' });
  }
});

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