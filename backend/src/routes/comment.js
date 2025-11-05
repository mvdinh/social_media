import express from 'express';
import Comment from '../models/Comment.js';
import { getContract } from '../config/contract.js';

const router = express.Router();

// ==================== ADD COMMENT ====================
router.post('/', async (req, res) => {
  try {
    const { postId, author, contentHash, mediaHash } = req.body;

    console.log('🔍 DEBUG - Request data:', { postId, author, contentHash, mediaHash });

    // 1️⃣ Validation
    if (!postId || !author || !contentHash) {
      console.log('❌ DEBUG - Validation failed');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: postId, author, contentHash',
      });
    }

    // 2️⃣ Get contract instance
    const contract = getContract();
    console.log('🔍 DEBUG - Contract address:', await contract.getAddress());

    // 3️⃣ KIỂM TRA POST ID CÓ TỒN TẠI TRONG BLOCKCHAIN KHÔNG
    console.log(`🔍 DEBUG - Checking if postId ${postId} exists on blockchain...`);
    try {
      const postCount = await contract.postCount();
      console.log('🔍 DEBUG - Total posts on blockchain:', postCount.toString());

      if (Number(postId) < 1 || Number(postId) > Number(postCount)) {
        console.log(`❌ DEBUG - Post ID ${postId} out of range (1-${postCount})`);
        return res.status(400).json({
          success: false,
          error: `Post ID ${postId} does not exist on blockchain`,
          details: `Valid post IDs are 1-${postCount}`
        });
      }

      // Kiểm tra post details
      const post = await contract.getPost(postId);
      console.log('🔍 DEBUG - Post data from blockchain:', {
        id: post.id.toString(),
        author: post.author,
        contentHash: post.contentHash,
      });

      if (post.author === '0x0000000000000000000000000000000000000000') {
        console.log(`❌ DEBUG - Post ID ${postId} has been deleted or invalid`);
        return res.status(400).json({
          success: false,
          error: `Post ID ${postId} is invalid or deleted`,
        });
      }

      console.log(`✅ DEBUG - Post ID ${postId} exists on blockchain`);

    } catch (blockchainError) {
      console.log('❌ DEBUG - Error checking post on blockchain:', blockchainError);
      return res.status(400).json({
        success: false,
        error: 'Cannot verify post on blockchain',
        details: blockchainError.message
      });
    }

    // 4️⃣ Add comment to blockchain
    console.log('🔍 DEBUG - Adding comment to blockchain...');
    let tx;
    if (mediaHash && mediaHash.trim() !== '') {
      tx = await contract.addCommentWithMedia(postId, contentHash, mediaHash);
    } else {
      tx = await contract.addComment(postId, contentHash);
    }
    
    console.log('🔍 DEBUG - Transaction hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ DEBUG - Transaction confirmed:', receipt.hash);

    // 5️⃣ Save comment to database
    const newComment = new Comment({
      postId: Number(postId),
      author,
      contentHash,
      mediaHash: mediaHash || '',
      txHash: receipt.hash,
      timestamp: Date.now(),
    });

    await newComment.save();
    console.log('✅ DEBUG - Comment saved to database');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      transactionHash: receipt.hash,
    });

  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      details: error.message,
    });
  }
});

// ==================== GET COMMENTS BY POST ID ====================
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    console.log('🔍 DEBUG - Get comments for postId:', postId);

    // 1️⃣ Validate postId
    if (!postId || isNaN(Number(postId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid postId',
      });
    }

    // 2️⃣ KIỂM TRA POST ID CÓ TỒN TẠI TRONG BLOCKCHAIN KHÔNG
    const contract = getContract();
    console.log(`🔍 DEBUG - Checking if postId ${postId} exists on blockchain...`);
    
    try {
      const postCount = await contract.postCount();
      
      if (Number(postId) < 1 || Number(postId) > Number(postCount)) {
        console.log(`❌ DEBUG - Post ID ${postId} out of range (1-${postCount})`);
        return res.status(400).json({
          success: false,
          error: `Post ID ${postId} does not exist on blockchain`,
          details: `Valid post IDs are 1-${postCount}`
        });
      }

      const post = await contract.getPost(postId);
      if (post.author === '0x0000000000000000000000000000000000000000') {
        console.log(`❌ DEBUG - Post ID ${postId} is invalid`);
        return res.status(400).json({
          success: false,
          error: `Post ID ${postId} is invalid or deleted`,
        });
      }

      console.log(`✅ DEBUG - Post ID ${postId} exists on blockchain`);

    } catch (blockchainError) {
      console.log('❌ DEBUG - Error checking post on blockchain:', blockchainError);
      return res.status(400).json({
        success: false,
        error: 'Cannot verify post on blockchain',
        details: blockchainError.message
      });
    }

    // 3️⃣ Fetch comments from database
    const comments = await Comment.find({
      postId: Number(postId),
    }).sort({ timestamp: 1 });

    console.log(`✅ DEBUG - Found ${comments.length} comments in database`);

    res.json({
      success: true,
      comments,
      count: comments.length,
    });

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
      details: error.message,
    });
  }
});

export default router;