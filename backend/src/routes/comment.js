import express from 'express';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Load contract config
const contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/SocialMedia.json')));
const contractAddress = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/contract-address.json')));
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(contractAddress.SocialMedia, contractABI.abi, provider);

// ==================== POST COMMENT ====================
router.post('/', async (req, res) => {
  console.log('========== 📝 POST /comments START ==========');

  try {
    const { txHash, postId, contentHash, mediaHash } = req.body;
    console.log('📥 Request:', { txHash, postId, contentHash, mediaHash });

    if (!txHash || !postId || !contentHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: txHash, postId, contentHash'
      });
    }

    // Check duplicate transaction
    const existed = await Comment.findOne({ txHash });
    if (existed) {
      console.log('⚠️ Transaction already processed');
      return res.status(400).json({
        success: false,
        error: 'Transaction already processed'
      });
    }

    // Wait for transaction to be mined
    console.log('⏳ Waiting for transaction...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get transaction receipt
    let receipt;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) break;

      console.log(`⏳ Attempt ${retries + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries++;
    }

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found on blockchain'
      });
    }

    if (receipt.status === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transaction failed on blockchain'
      });
    }

    console.log('✅ Transaction confirmed:', receipt.hash);

    // Parse CommentAdded event
    let commentEvent = null;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress.SocialMedia.toLowerCase()) continue;

      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog.name === 'CommentAdded') {
          commentEvent = parsedLog;
          console.log('🎉 Found CommentAdded event');
          break;
        }
      } catch (err) {
        // Skip unparseable logs
      }
    }

    if (!commentEvent) {
      return res.status(400).json({
        success: false,
        error: 'No CommentAdded event found'
      });
    }

    // Extract event data
    const eventPostId = Number(commentEvent.args[0]);
    const commenter = commentEvent.args[1];
    const eventContentHash = commentEvent.args[2];

    console.log('📋 Event data:', { eventPostId, commenter, eventContentHash });

    // Verify data matches
    if (eventPostId !== Number(postId)) {
      return res.status(400).json({
        success: false,
        error: 'Post ID mismatch'
      });
    }

    

    // Tìm commentIndex lớn nhất của post hiện tại
const lastComment = await Comment.findOne({ postId: Number(postId) })
  .sort({ commentIndex: -1 }); // sắp xếp giảm dần

// Lấy commentIndex, nếu undefined thì bắt đầu từ -1
const lastIndex = lastComment && typeof lastComment.commentIndex === 'number' 
  ? lastComment.commentIndex 
  : -1;

const nextIndex = lastIndex + 1;

const newComment = new Comment({
  postId: Number(postId),
  author: commenter,
  contentHash: eventContentHash,
  mediaHash: mediaHash || '',
  txHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  timestamp: new Date(),
  commentIndex: nextIndex
});

await newComment.save();


    // Update comments count in Post
    await Post.findOneAndUpdate(
      { postId: Number(postId) },
      { $inc: { comments: 1 } }
    );

    console.log('💾 Comment saved to database');
    console.log('========== ✅ POST /comments END ==========');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });

  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// ==================== GET COMMENTS BY POST ID ====================
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    console.log('🔍 Getting comments for postId:', postId);

    if (!postId || isNaN(Number(postId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid postId'
      });
    }

    // Fetch comments from database - FIXED: Use postId not blockchainId
    const comments = await Comment.find({
      postId: Number(postId)
    }).sort({ timestamp: 1 });

    console.log(`✅ Found ${comments.length} comments`);

    res.json({
      success: true,
      data: {
        postId: Number(postId),
        comments,
        count: comments.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments',
      details: error.message
    });
  }
});

// ==================== DELETE COMMENT ====================
router.delete('/', async (req, res) => {
  console.log('========== 🗑️ DELETE /comments START ==========');
  
  try {
    const { txHash, postId, commentIndex } = req.body;
    console.log('📥 Request:', { txHash, postId, commentIndex });

    if (!txHash || postId === undefined || commentIndex === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Get transaction receipt
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Transaction failed or not found' 
      });
    }

    // Parse CommentDeleted event
    let deletedEvent = null;
    
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== contractAddress.SocialMedia.toLowerCase()) {
        continue;
      }

      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics,
          data: log.data
        });

        if (parsedLog.name === 'CommentDeleted') {
          deletedEvent = parsedLog;
          break;
        }
      } catch (err) {}
    }

    if (!deletedEvent) {
      return res.status(400).json({ 
        success: false,
        error: 'No CommentDeleted event found' 
      });
    }

    // Mark comment as deleted (soft delete)
    const comment = await Comment.findOneAndUpdate(
      { postId: Number(postId), commentIndex: Number(commentIndex) },
      { isDeleted: true },
      { new: true }
    );

    if (!comment) {
      return res.status(404).json({ 
        success: false,
        error: 'Comment not found' 
      });
    }

    // Update comments count
    await Post.findOneAndUpdate(
      { postId: Number(postId) },
      { $inc: { comments: -1 } }
    );

    console.log('✅ Comment deleted');
    console.log('========== 🟢 DELETE /comments END ==========');

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;