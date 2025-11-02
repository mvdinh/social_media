// routes/posts.js
import express from "express";
import { ethers } from "ethers";
import mongoose from "mongoose";
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

// === Blockchain Config ===
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // local Hardhat node
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // ⚠️ Private key của Hardhat node

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress.SocialMedia, contractABI.abi, signer);

console.log("✅ Blockchain connected at:", RPC_URL);
console.log("👛 Signer address:", await signer.getAddress());

// === Router ===
const router = express.Router();

// === POST: Tạo bài viết mới ===
router.post("/", async (req, res) => {
  try {
    const { contentHash, mediaHashes, mediaType, walletAddress } = req.body;

    console.log("📥 Creating post on blockchain...");

    let tx;
    if (mediaHashes && mediaHashes.length > 0) {
      tx = await contract.createPostWithMedia(contentHash, mediaHashes, mediaType);
    } else {
      tx = await contract.createPost(contentHash);
    }

    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();
    console.log("📜 Transaction confirmed:", receipt.hash);

    // Lấy event PostCreated từ logs
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
      throw new Error("Không tìm thấy event PostCreated trong transaction logs");
    }

    // Với Ethers v6: kết quả là BigInt -> cần convert sang Number
    const blockchainPostId = Number(event.args[0]); // postId
    const authorAddress = event.args[1];
    const ipfsHash = event.args[2];

    console.log(
      `✅ PostCreated Event -> ID: ${blockchainPostId}, Author: ${authorAddress}, IPFS: ${ipfsHash}`
    );

    // Lưu vào MongoDB
    const post = await Post.create({
      blockchainId: blockchainPostId,
      author: walletAddress,
      contentHash,
      mediaHashes: mediaHashes || [],
      mediaType: mediaType || 0,
      timestamp: Date.now(),
      likes: 0,
      shares: 0,
      isNFT: false,
      nftTokenId: 0,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      createdAt: new Date(),
    });

    res.json({
      success: true,
      blockchainPostId,
      dbPostId: post._id,
      txHash: receipt.hash,
    });
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).limit(20);
  const total = await Post.countDocuments();

    res.json({
      total,
      posts
    });
});

router.get('/:id/verify', async (req, res) => {
  try {
    const dbPost = await Post.findOne({ blockchainId: req.params.id });
    if (!dbPost) return res.status(404).json({ error: 'Post not found in DB' });

    const blockchainPost = await contract.getPost(req.params.id);

    const isValid =
      dbPost.author.toLowerCase() === blockchainPost.author.toLowerCase() &&
      dbPost.contentHash === blockchainPost.contentHash;

    // 🔧 Convert BigInt → String trước khi trả về
    const blockchainPostNormalized = Object.fromEntries(
      Object.entries(blockchainPost).map(([key, value]) => [
        key,
        typeof value === 'bigint' ? value.toString() : value
      ])
    );

    res.json({
      isValid,
      dbData: dbPost,
      blockchainData: blockchainPostNormalized
    });

  } catch (error) {
    console.error("❌ Verify error:", error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
