import express from 'express';
import { ethers } from 'ethers';
import Post from '../models/Post.js';
import Like from '../models/Like.js';
import Comment from '../models/Comment.js';
import Share from '../models/Share.js';
import dotenv from 'dotenv';
dotenv.config();

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
// Sync Comments for a Post
// ===============================================
router.post('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const blockchainComments = await contract.getComments(postId);

    let synced = 0;

    for (const bc of blockchainComments) {
      const commentData = {
        postId: Number(postId),
        author: bc.author.toLowerCase(),
        contentHash: bc.contentHash,
        mediaHash: bc.mediaHash,
        timestamp: new Date(Number(bc.timestamp) * 1000),
        txHash: req.body.txHash || ''
      };

      // Check if comment already exists (basic check by timestamp and author)
      const existing = await Comment.findOne({
        postId: commentData.postId,
        author: commentData.author,
        timestamp: commentData.timestamp
      });

      if (!existing) {
        await Comment.create(commentData);
        synced++;
      }
    }

    res.json({
      success: true,
      synced,
      total: blockchainComments.length,
      message: `Synced ${synced} comments`
    });

  } catch (error) {
    console.error('Error syncing comments:', error);
    res.status(500).json({ error: 'Failed to sync comments' });
  }
});

// ===============================================
// Record Like (after blockchain transaction)
// ===============================================
router.post('/like', async (req, res) => {
  try {
    const { postId, user, txHash } = req.body;

    if (!postId || !user || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if already exists
    let like = await Like.findOne({ 
      postId: Number(postId), 
      user: user.toLowerCase() 
    });

    if (!like) {
      like = await Like.create({
        postId: Number(postId),
        user: user.toLowerCase(),
        txHash
      });

      // Update post likes count
      await Post.findOneAndUpdate(
        { blockchainId: Number(postId) },
        { $inc: { likes: 1 } }
      );
    }

    res.json({
      success: true,
      like,
      message: 'Like recorded'
    });

  } catch (error) {
    console.error('Error recording like:', error);
    res.status(500).json({ error: 'Failed to record like' });
  }
});

// ===============================================
// Record Unlike (after blockchain transaction)
// ===============================================
router.post('/unlike', async (req, res) => {
  try {
    const { postId, user, txHash } = req.body;

    if (!postId || !user) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Remove like
    const result = await Like.findOneAndDelete({ 
      postId: Number(postId), 
      user: user.toLowerCase() 
    });

    if (result) {
      // Update post likes count
      await Post.findOneAndUpdate(
        { blockchainId: Number(postId) },
        { $inc: { likes: -1 } }
      );
    }

    res.json({
      success: true,
      message: 'Unlike recorded'
    });

  } catch (error) {
    console.error('Error recording unlike:', error);
    res.status(500).json({ error: 'Failed to record unlike' });
  }
});

// ===============================================
// Record Share (after blockchain transaction)
// ===============================================
router.post('/share', async (req, res) => {
  try {
    const { postId, user, txHash } = req.body;

    if (!postId || !user || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const share = await Share.create({
      postId: Number(postId),
      user: user.toLowerCase(),
      txHash
    });

    // Update post shares count
    await Post.findOneAndUpdate(
      { blockchainId: Number(postId) },
      { $inc: { shares: 1 } }
    );

    res.json({
      success: true,
      share,
      message: 'Share recorded'
    });

  } catch (error) {
    console.error('Error recording share:', error);
    res.status(500).json({ error: 'Failed to record share' });
  }
});

// ===============================================
// Record Comment (after blockchain transaction)
// ===============================================
router.post('/comment', async (req, res) => {
  try {
    const { postId, author, contentHash, mediaHash, txHash } = req.body;

    if (!postId || !author || !contentHash || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const comment = await Comment.create({
      postId: Number(postId),
      author: author.toLowerCase(),
      contentHash,
      mediaHash: mediaHash || '',
      timestamp: new Date(),
      txHash
    });

    res.json({
      success: true,
      comment,
      message: 'Comment recorded'
    });

  } catch (error) {
    console.error('Error recording comment:', error);
    res.status(500).json({ error: 'Failed to record comment' });
  }
});

// ===============================================
// Listen and Sync Events (Real-time)
// ===============================================
router.post('/events/listen', async (req, res) => {
  try {
    const { fromBlock = -1000 } = req.body;

    const events = {
      posts: [],
      likes: [],
      unlikes: [],
      comments: [],
      shares: []
    };

    // Get PostCreated events
    const postFilter = contract.filters.PostCreated();
    const postEvents = await contract.queryFilter(postFilter, fromBlock);
    
    for (const event of postEvents) {
      events.posts.push({
        postId: event.args.postId.toString(),
        author: event.args.author,
        contentHash: event.args.contentHash,
        mediaType: event.args.mediaType,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    }

    // Get PostLiked events
    const likeFilter = contract.filters.PostLiked();
    const likeEvents = await contract.queryFilter(likeFilter, fromBlock);
    
    for (const event of likeEvents) {
      events.likes.push({
        postId: event.args.postId.toString(),
        user: event.args.user,
        txHash: event.transactionHash
      });
    }

    // Get CommentAdded events
    const commentFilter = contract.filters.CommentAdded();
    const commentEvents = await contract.queryFilter(commentFilter, fromBlock);
    
    for (const event of commentEvents) {
      events.comments.push({
        postId: event.args.postId.toString(),
        author: event.args.author,
        contentHash: event.args.contentHash,
        txHash: event.transactionHash
      });
    }

    res.json({
      success: true,
      events,
      count: {
        posts: events.posts.length,
        likes: events.likes.length,
        comments: events.comments.length
      }
    });

  } catch (error) {
    console.error('Error listening to events:', error);
    res.status(500).json({ error: 'Failed to listen to events' });
  }
});

export default router;