import express from "express";
import { uploadToIPFS } from "../utils/pinata.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 🔑 Lấy API key từ .env
const PINATA_API_KEY = "ee0ab07677049d11295a";
const PINATA_SECRET = "f09107872299d248f3167f7a4d8d42a714649516b1715cc26315cbbe8dbdca7d";

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
        pageLimit: 10, // chỉ lấy 10 file gần nhất
      },
    });

    // Map dữ liệu để gửi về frontend
    const files = response.data.rows.map((item) => ({
      ipfsHash: item.ipfs_pin_hash,
      name: item.metadata?.name || "Unnamed",
      datePinned: item.date_pinned,
      url: `https://gateway.pinata.cloud/ipfs/${item.ipfs_pin_hash}`,
    }));

    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching from Pinata:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch pinned files from Pinata" });
  }
});

// POST /post → upload file lên IPFS
router.post("/post", async (req, res) => {
  try {
    const { filePath, owner, timestamp } = req.body;

    if (!filePath || !owner) {
      return res.status(400).json({ error: "filePath and owner are required" });
    }

    const ipfsHash = await uploadToIPFS(filePath);

    res.json({ ipfsHash, owner, timestamp, message: "Story uploaded to IPFS" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
