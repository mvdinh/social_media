import express from 'express';
import Like from '../models/Like.js';
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

router.post("/", async (req, res) => {
  try {
    const { txHash, postId, user } = req.body;

    if (!txHash || !postId || !user) {
      return res.status(400).json({ error: "Missing txHash, postId or user" });
    }

    console.log("📥 Received like from:", user);
    console.log("🆔 Post ID:", postId);
    console.log("🔗 Transaction hash:", txHash);

    // 1️⃣ Xác minh giao dịch trên blockchain
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return res.status(404).json({ error: "Transaction not found on blockchain" });
    }
    console.log("✅ Transaction receipt found:", receipt.transactionHash);

    // 2️⃣ Tìm event PostLiked trong logs
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "PostLiked");

    if (!event) {
      console.warn("⚠️ Không tìm thấy event PostLiked trong transaction logs");
      return res.status(400).json({ error: "No PostLiked event found in tx logs" });
    }

    console.log("🎉 Event PostLiked:", event.args);

    // 3️⃣ Tạo bản ghi Like mới
    const like = new Like({
      postId: Number(postId),
      user,
      txHash: receipt.hash,
      timestamp: new Date()
    });
    await like.save();
    console.log("💾 Like saved:", like);

    // 4️⃣ Cập nhật số lượng like trong bảng Post
    const post = await Post.findOneAndUpdate(
      { postId: Number(postId) },
      { $inc: { likes: 1 } },
      { new: true }
    );
    console.log("🔢 Updated post like count:", post?.likes);

    res.status(201).json({
      success: true,
      message: "Đã like bài viết!",
      data: {
        like,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        totalLikes: post?.likes || 1,
      },
    });

  } catch (error) {
    console.error("❌ Error saving like:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    const { txHash, postId, user } = req.body;

    if (!txHash || !postId || !user) {
      return res.status(400).json({ error: "Missing txHash, postId or user" });
    }

    console.log("📥 Received unlike from:", user);
    console.log("🔗 Transaction hash:", txHash);

    // 1️⃣ Xác minh giao dịch trên blockchain
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return res.status(404).json({ error: "Transaction not found on blockchain" });
    }

    // 2️⃣ Phân tích event PostUnliked trong logs
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "PostUnliked");

    if (!event) {
      return res.status(400).json({ error: "No PostUnliked event found in tx logs" });
    }

    // 3️⃣ Xóa bản ghi like trong MongoDB
    const deletedLike = await Like.findOneAndDelete({ postId: Number(postId), user });
    if (!deletedLike) {
      return res.status(404).json({ error: "Like not found for this user and post" });
    }

    // 4️⃣ Giảm số lượng like trong Post
    const post = await Post.findOneAndUpdate(
      { postId: Number(postId) },
      { $inc: { likes: -1 } },
      { new: true }
    );

    // 5️⃣ Trả về kết quả
    res.status(200).json({
      success: true,
      message: "Đã bỏ like bài viết!",
      data: {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        totalLikes: post?.likes || 0,
      },
    });
  } catch (error) {
    console.error("❌ Error unliking post:", error);
    res.status(500).json({ error: error.message });
  }
});



/**
 * GET /api/likes/:postId
 */
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(`📊 Getting likes for post: ${postId}`);
    
    const likes = await Like.find({ postId: Number(postId) }).sort({ timestamp: -1 });
    console.log(`✅ Found ${likes.length} likes`);

    res.json({
      success: true,
      data: {
        postId,
        count: likes.length,
        likes
      }
    });
  } catch (err) {
    console.error('❌ Error getting likes:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});

/**
 * GET /api/likes/check/:postId/:user
 */
router.get('/check/:postId/:user', async (req, res) => {
  try {
    const { postId, user } = req.params;
    console.log(`🔍 Checking like status on blockchain: post=${postId}, user=${user}`);

    // Gọi smart contract để check trực tiếp
    const isLikedOnChain = await contract.hasLiked(Number(postId), user);
    console.log(`✅ Blockchain like status: ${isLikedOnChain ? 'LIKED' : 'NOT LIKED'}`);

    res.json({
      success: true,
      data: {
        isLiked: isLikedOnChain
      }
    });
  } catch (err) {
    console.error('❌ Error checking like on blockchain:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});


export default router;