import express from "express";
import { uploadToIPFS } from "../utils/pinata.js";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import ether from "ethers";

import mongoose from "mongoose";
import Reaction from '../models/Reaction.js';

dotenv.config();

const router = express.Router();

const MONGODB_URI = process.env.MONGODB_URI;

// Kết nối tới MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully.'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

//Lấy API key
const PINATA_API_KEY = "ef6b1f8bcd4b17359978";
const PINATA_SECRET = "74b088b402921ea8e23a904d0f121b2d0d6f9181cf4dad4091565dc880e4d8c8";

// File từ React sẽ được lưu tạm vào thư mục 'uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    // Tự động tạo thư mục 'uploads/' nếu chưa có
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất (dựa trên thời gian) để tránh bị ghi đè
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// =======================
// 📍 GET / → lấy danh sách file pinned từ Pinata
// =======================
router.get("/", async (req, res) => {
  try {
    const response = await axios.get("https://api.pinata.cloud/data/pinList", {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      params: {
        status: "pinned",
      },
    });

    // Map dữ liệu để gửi về frontend
    const files = response.data.rows.map((item) => {
      // Lấy keyvalues từ metadata
      const kv = item.metadata.keyvalues;

      return {
        ipfsHash: item.ipfs_pin_hash,
        name: kv?.owner || "Unknown",
        datePinned: item.date_pinned,
        url: `https://gateway.pinata.cloud/ipfs/${item.ipfs_pin_hash}`,
        type: kv?.type || "story-photo", // Mặc định là 'Photo' nếu không có
        backgroundColor: kv?.backgroundColor || null,
        content: kv?.contentSnippet || null
    }});

    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching from Pinata:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch pinned files from Pinata" });
  }
});

// POST /post → upload file lên IPFS
router.post("/post", upload.single("storyFile"),async (req, res) => {
  try {
    const { owner, type, content, backgroundColor } = req.body;

    const timestamp = Date.now();

    // File mà React gửi lên sẽ nằm trong 'req.file'
    const file = req.file;

    if (!owner || !type) {
      return res.status(400).json({ error: "Type and owner are required" });
    }

    let ipfsHash;

    if (type === "Photo" || type === "Video") {
      if (!file) {
        return res.status(400).json({ error: "File is required for Photo or Video type" });
      }

      const metadata = {  
        name: `Story by ${owner} at ${timestamp}`,
        keyvalues: {
          owner,
          timestamp,
          type: (type === "Video" ? "story-video" : "story-photo"),
        },
      };
      ipfsHash = await uploadToIPFS(file.path, metadata);

    
      //Xóa file tạm trên server sau khi đã upload lên IPFS
      fs.unlinkSync(file.path);
    } else if (type === "Text") {
      if (!content || !backgroundColor) {
        return res.status(400).json({ error: "content and backgroundColor are required for Text type" });
      }
      const dataToPin = {
        pinataMetadata: {
          name: `Text Story by ${owner} at ${timestamp || Date.now()}`,
          keyvalues: { 
            owner, 
            timestamp: timestamp, 
            type: "story-text",
            backgroundColor: backgroundColor,
            contentSnippet: content.substring(0, 50),
          }
        },
        pinataContent: {
          content: content,
          backgroundColor: backgroundColor,
          owner: owner
        }
      };
      const response = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", dataToPin, {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET
        }
      });
      ipfsHash = response.data.IpfsHash;
    } else {
      return res.status(400).json({ error: "Invalid story 'type'" });
    }

    res.json({ ipfsHash, owner, timestamp, message: "Story uploaded to IPFS" });
  } catch (err) {
    console.error(err);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Đã xóa file tạm: ${req.file.path}`);
      } catch (e) {
        console.error("Lỗi khi xóa file tạm:", e);
      }
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /react
router.post("/react", async (req, res) => {
    try {
      const { storyHash, reactorAddress, reactionType, signature, message } = req.body;

      if (!storyHash || !reactorAddress || !reactionType || !signature || !message) {
        return res.status(400).json({ error: "Yêu cầu chữ ký để xác thực ví." });
      }

      const recoveredAddress = ethers.utils.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== reactorAddress.toLowerCase()) {
          //Chữ ký không khớp với địa chỉ được khai báo
          return res.status(401).json({ error: "Chữ ký không hợp lệ. Vui lòng kết nối ví." });
      }

      const updatedReaction = await Reaction.findOneAndUpdate(
        { 
          storyHash: storyHash, 
          reactionType: reactionType 
        }, 
        { 
          $inc: { count: 1 } 
        },
        {
          new: true, 
          upsert: true
        }
       );     

      res.json({ 
          success: true,
          message: "Reaction recorded successfully (Off-Chain).",
          currentCount: updatedReaction.count, // Bộ đếm mới từ MongoDB
          reactionType: updatedReaction.reactionType
      });

  } catch (err) {
      console.error("❌ LỖI GHI REACTION:", err.response?.data || err.message);
      res.status(500).json({ error: err.message || "Failed to record reaction." });
  }
});

//get /reactions/:storyHash
router.get("/reactions/:storyHash", async (req, res) => {
    try {
        const { storyHash } = req.params;
        
        const countsArray = await Reaction.find({ storyHash: storyHash });

        const counts = countsArray.reduce((acc, curr) => {
            acc[curr.reactionType] = curr.count;
            return acc;
        }, {});

        res.json(counts);
    } catch (err) {
        console.error("❌ LỖI TRUY VẤN REACTION:", err.message);
        res.status(500).json({ error: "Failed to fetch reaction counts from MongoDB." });
    }
});

export default router;
