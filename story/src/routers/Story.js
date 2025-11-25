import express from "express";
import { uploadToIPFS } from "../utils/pinata.js";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const router = express.Router();

// 🔑 Lấy API key từ .env
const PINATA_API_KEY = "ee0ab07677049d11295a";
const PINATA_SECRET = "f09107872299d248f3167f7a4d8d42a714649516b1715cc26315cbbe8dbdca7d";

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
        return res.status(400).json({ error: "File (storyFile) is required for Photo or Video type" });
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
    } else {
      return res.status(400).json({ error: "Invalid story 'type'" });
    }

    res.json({ ipfsHash, owner, timestamp, message: "Story uploaded to IPFS" });
  } catch (err) {
    console.error(err);
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

export default router;
