import express from "express";
import Post from "../models/Post.js";
import ipfsService from "../services/ipfsService.js";

const router = express.Router();

const API_BASE = "http://localhost:5000/api/ipfs/";

router.get("/getAllPost", async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 });

    const formatted = await Promise.all(
      posts.map(async (p) => {
        // 📝 Lấy content (văn bản) từ IPFS Helia
        let content = "";
        try {
          // 1. Validate và clean hash
          let hash = p.contentHash;
          if (!hash || hash.trim() === '') {
            throw new Error("Content hash is empty or missing");
          }
          
          if (hash.startsWith('ipfs://')) {
            hash = hash.replace('ipfs://', '');
          }
          hash = hash.trim();
          
          console.log(`🔍 Fetching content for post ${p._id} with hash: ${hash}`);
          
          // 2. Lấy buffer từ IPFS
          const { content: buffer } = await ipfsService.getFile(hash);
          
          // 3. 🔽 CHỈ CẦN CHUYỂN SANG STRING 🔽
          // (Toàn bộ đoạn try/catch parse JSON đã bị xóa)
          content = buffer.toString('utf-8');
          // 🔼 HẾT 🔼
          
          console.log(`✅ Content loaded for post ${p._id}: ${content.substring(0, 50)}...`);
          
        } catch (err) {
          console.warn(`⚠️ Cannot load content for post ${p._id}:`, err.message);
          console.warn(`   Hash was: ${p.contentHash}`);
          content = "[Content unavailable]"; // Đặt giá trị mặc định khi lỗi
        }

        // 🖼️ Lấy media proxy URLs
        const mediaUrls = p.mediaHashes?.map(
          (h) => `${API_BASE}${h.replace('ipfs://', '').trim()}`
        ) || [];

        return {
          id: p._id,
          blockchainId: p.blockchainId,
          author: p.author,
          content: content, // 👈 Bây giờ sẽ là text chính xác
          contentHash: p.contentHash,
          media: mediaUrls,
          mediaType: p.mediaType,
          timestamp: p.timestamp,
          likes: p.likes || 0,
          shares: p.shares || 0,
          txHash: p.txHash,
        };
      })
    );

    res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Error fetching posts:", err);
    res.status(500).json({ error: "Server error fetching posts" });
  }
});

export default router;