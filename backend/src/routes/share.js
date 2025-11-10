import express from 'express';
import Share from '../models/Share.js';
import Post from '../models/Post.js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load contract config
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/SocialMedia.json'), 'utf-8')
);
const contractAddress = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/contract-address.json'), 'utf-8')
);

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(
  contractAddress.SocialMedia,
  contractABI.abi,
  provider
);

/**
 * POST /api/shares
 * Body: { txHash, postId, author }
 */
router.post('/', async (req, res) => {
  try {
    const { txHash, postId, author } = req.body;

    if (!txHash || !postId || !author) {
      console.log('❌ DEBUG - Validation failed');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, postId, author',
      });
    }

    console.log('📥 Received share request:', { txHash, postId, author });

    // 1️⃣ Wait for transaction
    console.log('⏳ Waiting for transaction to be mined...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2️⃣ Get transaction receipt
    let receipt;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) break;

        console.log(`⏳ Attempt ${retries + 1}/${maxRetries}: waiting...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        retries++;
      } catch (err) {
        console.error('Error fetching receipt:', err.message);
        retries++;
        if (retries >= maxRetries) throw err;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found on blockchain',
      });
    }

    console.log('✅ Transaction receipt found:', {
      blockNumber: receipt.blockNumber,
      status: receipt.status,
      logs: receipt.logs.length
    });

    // 3️⃣ Check transaction status
    if (receipt.status === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction failed on blockchain',
      });
    }

    // 4️⃣ Parse PostShared event
    console.log('🔍 Parsing transaction logs...');
    let shareEvent = null;

    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress.SocialMedia.toLowerCase()) {
        continue;
      }

      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        console.log('✅ Parsed log:', parsedLog.name);

        if (parsedLog.name === 'PostShared') {
          shareEvent = parsedLog;
          console.log('🎉 Found PostShared event!');
          break;
        }
      } catch (parseError) {
        // Skip unparseable logs
      }
    }

    if (!shareEvent) {
      console.error('❌ No PostShared event found');
      return res.status(400).json({
        success: false,
        error: 'No PostShared event found in transaction logs',
      });
    }

    // 5️⃣ Extract event data
    const eventPostId = Number(shareEvent.args[0]);
    const sharer = shareEvent.args[1];
    const shareCount = Number(shareEvent.args[2]);

    console.log('📋 Event data:', {
      postId: eventPostId,
      sharer,
      shareCount
    });

    // 6️⃣ Verify data matches
    if (eventPostId !== Number(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Post ID mismatch',
      });
    }

    if (sharer.toLowerCase() !== author.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Author address mismatch',
      });
    }

    console.log('✅ Verified PostShared event');

    // 7️⃣ Save share to MongoDB
    const newShare = new Share({
      postId: Number(postId),
      author,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
    });

    await newShare.save();
    console.log('💾 Share saved to database');

    // 8️⃣ Update shares count in Post
    const post = await Post.findOneAndUpdate(
      { blockchainId: postId },
      { $inc: { shares: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      share: newShare,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      totalShares: post?.shares || shareCount,
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

    // Lấy danh sách share từ MongoDB
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