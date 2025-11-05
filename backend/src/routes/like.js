import express from 'express';
import Like from '../models/Like.js';
import Post from '../models/Post.js';
import { ethers } from 'ethers';
import { getContract, getSigner } from '../config/contract.js';

const router = express.Router();

/**
 * POST /likes
 * Body: { postId, user }
 */
router.post('/', async (req, res) => {
  const { postId, user } = req.body;

  try {
    // Validation
    if (!postId || !user) {
      return res.status(400).json({ message: 'postId và user là bắt buộc' });
    }

    // Kiểm tra xem đã like chưa
    const existingLike = await Like.findOne({ postId, user });
    if (existingLike) {
      return res.status(400).json({ message: 'User đã like bài này rồi.' });
    }

    // 1️⃣ Ghi like trên blockchain
    const contract = getContract();
    const signer = getSigner();
    
    console.log(`⏳ Đang like post ${postId} từ ${user}...`);
    
    // Gọi contract với signer (không cần { from: user })
    const tx = await contract.likePost(postId);
    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Like tx mined:', receipt.hash);

    // 2️⃣ Kiểm tra event (nếu contract emit event)
    const likeEvent = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(event => event && event.name === 'PostLiked');

    if (likeEvent) {
      console.log('📢 Event PostLiked:', likeEvent.args);
    }

    // 3️⃣ Lưu vào MongoDB
    const like = new Like({
      postId,
      user,
      txHash: receipt.hash,
      timestamp: new Date()
    });
    await like.save();

    // 4️⃣ Update count likes trong Post
    const post = await Post.findOneAndUpdate(
      { blockchainId: postId },
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!post) {
      console.warn(`⚠️ Post ${postId} không tồn tại trong database`);
    }

    res.status(201).json({
      success: true,
      message: 'Đã like bài viết!',
      data: {
        like,
        txHash: receipt.hash,
        totalLikes: post?.likes || 1
      }
    });

  } catch (err) {
    console.error('❌ Error liking post:', err);

    // Xử lý các loại lỗi cụ thể
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'User đã like bài này rồi.' 
      });
    }

    if (err.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        success: false,
        message: 'Lỗi khi gọi smart contract. Có thể post không tồn tại hoặc đã bị like.',
        error: err.reason || err.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});

/**
 * DELETE /likes (unlike)
 * Body: { postId, user }
 */
router.delete('/', async (req, res) => {
  const { postId, user } = req.body;

  try {
    // Validation
    if (!postId || !user) {
      return res.status(400).json({ message: 'postId và user là bắt buộc' });
    }

    // Kiểm tra xem có like không
    const existingLike = await Like.findOne({ postId, user });
    if (!existingLike) {
      return res.status(404).json({ 
        success: false,
        message: 'Chưa like bài viết này.' 
      });
    }

    // 1️⃣ Gọi smart contract để unlike
    const contract = getContract();
    
    console.log(`⏳ Đang unlike post ${postId}...`);
    
    const tx = await contract.unlikePost(postId);
    console.log('📤 Unlike transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Unlike tx mined:', receipt.hash);

    // 2️⃣ Xóa like khỏi MongoDB
    await Like.findOneAndDelete({ postId, user });

    // 3️⃣ Update count likes trong Post
    const post = await Post.findOneAndUpdate(
      { blockchainId: postId },
      { $inc: { likes: -1 } },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Đã unlike bài viết!',
      data: {
        txHash: receipt.hash,
        totalLikes: post?.likes || 0
      }
    });

  } catch (err) {
    console.error('❌ Error unliking post:', err);

    if (err.code === 'CALL_EXCEPTION') {
      return res.status(400).json({
        success: false,
        message: 'Lỗi khi gọi smart contract. Có thể chưa like bài này.',
        error: err.reason || err.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});

/**
 * GET /likes/:postId
 * Lấy danh sách likes của một post
 */
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const likes = await Like.find({ postId }).sort({ timestamp: -1 });
    const count = likes.length;

    res.json({
      success: true,
      data: {
        postId,
        count,
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
 * GET /likes/check/:postId/:user
 * Kiểm tra user đã like post chưa
 */
router.get('/check/:postId/:user', async (req, res) => {
  const { postId, user } = req.params;

  try {
    const like = await Like.findOne({ postId, user });

    res.json({
      success: true,
      data: {
        isLiked: !!like,
        like: like || null
      }
    });
  } catch (err) {
    console.error('❌ Error checking like:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});

export default router;