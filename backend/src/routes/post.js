// routes/posts.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Post from "../models/Post.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Load ABI & Address ===
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/SocialMedia.json"), "utf-8")
);
const contractAddress = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/contract-address.json"), "utf-8")
);

// === Blockchain Provider (chỉ đọc, không ký) ===
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

const contract = new ethers.Contract(
  contractAddress.SocialMedia,
  contractABI.abi,
  provider
);

const router = express.Router();

console.log("✅ Blockchain (read-only) connected at:", RPC_URL);

// =============================
// POST /api/posts
// User đã gọi blockchain ở client
// Backend chỉ lưu thông tin & verify tx
// =============================
router.post("/", async (req, res) => {
  try {
    const { txHash, walletAddress, contentHash, mediaHashes, mediaType } = req.body;

    if (!txHash || !walletAddress) {
      return res.status(400).json({ error: "Missing txHash or walletAddress" });
    }

    console.log("📥 Received post from:", walletAddress);
    console.log("🔗 Transaction hash:", txHash);

    // 1️⃣ Xác minh giao dịch trên blockchain
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return res.status(404).json({ error: "Transaction not found on blockchain" });
    }

    // 2️⃣ Phân tích event PostCreated trong logs
    const event = receipt.logs
      .map((log) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "PostCreated");

    if (!event) {
      return res.status(400).json({ error: "No PostCreated event found in tx logs" });
    }

    const blockchainPostId = Number(event.args[0]);
    const authorAddress = event.args[1];
    const ipfsHash = event.args[2];

    if (authorAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ error: "Wallet address mismatch with event author" });
    }

    console.log(`✅ Verified PostCreated: ID=${blockchainPostId}, author=${authorAddress}`);

    // 3️⃣ Lưu vào MongoDB
    const post = await Post.create({
      blockchainId: blockchainPostId,
      author: walletAddress,
      contentHash,
      mediaHashes: mediaHashes || [],
      mediaType: mediaType || 0,
      txHash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      likes: 0,
      shares: 0,
      isNFT: false,
      nftTokenId: 0,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      blockchainPostId,
      dbPostId: post._id,
      txHash,
    });
  } catch (error) {
    console.error("❌ Error saving post:", error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// GET /api/posts
// =============================
router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
  const total = await Post.countDocuments();
  res.json({ total, posts });
});

// =============================
// GET /api/posts/:id/verify
// =============================
router.get("/:id/verify", async (req, res) => {
  try {
    const dbPost = await Post.findOne({ blockchainId: req.params.id });
    if (!dbPost) return res.status(404).json({ error: "Post not found in DB" });

    const blockchainPost = await contract.getPost(req.params.id);

    const isValid =
      dbPost.author.toLowerCase() === blockchainPost.author.toLowerCase() &&
      dbPost.contentHash === blockchainPost.contentHash;

    const blockchainData = Object.fromEntries(
      Object.entries(blockchainPost).map(([k, v]) => [
        k,
        typeof v === "bigint" ? v.toString() : v,
      ])
    );

    res.json({ isValid, dbData: dbPost, blockchainData });
  } catch (error) {
    console.error("❌ Verify error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
