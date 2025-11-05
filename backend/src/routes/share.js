import express from 'express';
import Share from '../models/Share.js'; // ✅ đổi lại đúng model Share
import { getContract } from '../config/contract.js';

const router = express.Router();

/**
 * POST /api/shares
 * Body: { postId, author }
 */
router.post('/', async (req, res) => {
  try {
    const { postId, author } = req.body;

    if (!postId || !author) {
      console.log('❌ DEBUG - Validation failed');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: postId, author',
      });
    }

    // 1️⃣ Get contract
    const contract = getContract();
    console.log('🔍 DEBUG - Contract address:', await contract.getAddress());

    // 2️⃣ Check if post exists on blockchain
    console.log(`🔍 DEBUG - Checking if postId ${postId} exists...`);
    const postCount = await contract.postCount();

    if (Number(postId) < 1 || Number(postId) > Number(postCount)) {
      console.log(`❌ DEBUG - Post ID ${postId} out of range`);
      return res.status(400).json({
        success: false,
        error: `Post ID ${postId} does not exist on blockchain`,
      });
    }

    const post = await contract.getPost(postId);
    if (post.author === '0x0000000000000000000000000000000000000000') {
      console.log(`❌ DEBUG - Post ID ${postId} invalid or deleted`);
      return res.status(400).json({
        success: false,
        error: `Post ID ${postId} is invalid or deleted`,
      });
    }

    console.log(`✅ DEBUG - Post ID ${postId} exists on blockchain`);

    // 3️⃣ Call sharePost on blockchain
    console.log('🔍 DEBUG - Sending share transaction...');
    const tx = await contract.sharePost(postId); // author là msg.sender trong signer
    console.log('🔍 DEBUG - Transaction hash:', tx.hash);

    const receipt = await tx.wait();
    console.log('✅ DEBUG - Transaction confirmed:', receipt.hash);

    // 4️⃣ Save share to MongoDB
    const newShare = new Share({
      postId: Number(postId),
      author,
      txHash: receipt.hash,
    });

    await newShare.save();
    console.log('✅ DEBUG - Share saved to database');

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      share: newShare,
      transactionHash: receipt.hash,
    });

  } catch (error) {
    console.error('❌ Error sharing post:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share post',
      details: error.message,
    });
  }
});

/**
 * GET /api/shares/:postId
 * → Lấy danh sách người đã share bài viết
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    console.log('🔍 DEBUG - Get shares for postId:', postId);

    if (!postId || isNaN(Number(postId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid postId',
      });
    }

    // 1️⃣ Kiểm tra post tồn tại trên blockchain
    const contract = getContract();
    const postCount = await contract.postCount();

    if (Number(postId) < 1 || Number(postId) > Number(postCount)) {
      return res.status(400).json({
        success: false,
        error: `Post ID ${postId} does not exist on blockchain`,
      });
    }

    // 2️⃣ Lấy danh sách share từ MongoDB
    const shares = await Share.find({ postId: Number(postId) }).sort({ timestamp: -1 });

    res.json({
      success: true,
      shares,
      count: shares.length,
    });

  } catch (error) {
    console.error('❌ Error fetching shares:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shares',
      details: error.message,
    });
  }
});

export default router;
