import fs from "fs";
import axios from "axios";
import Story from "../models/story.js";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../services/ipfs.service.js";
import { IPFS_CONFIG } from "../config/ipfs.js";

/**
 * GET /api/story
 * Lấy danh sách Story từ DB
 */
export const getStories = async (req, res) => {
  try {
    // Lấy tất cả story, sắp xếp mới nhất lên đầu
    const stories = await Story.find().sort({ createdAt: -1 });
    
    const formattedStories = stories.map(s => ({
      _id: s._id,
      owner: s.owner,
      type: s.type,
      content: s.content,
      backgroundColor: s.backgroundColor,
      ipfsHash: s.ipfsHash,
      // URL Proxy để Frontend hiển thị file
      url: s.mediaUrl ? `http://localhost:3000/api/story/view/${s.ipfsHash}` : null, 
      createdAt: s.createdAt
    }));

    res.json(formattedStories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/story/create
 * Tạo Story (Upload IPFS + Save DB)
 */
export const createStory = async (req, res) => {
  try {
    // 1. LẤY OWNER TỪ JWT
    const owner = req.user?.address; 
    if (!owner) return res.status(401).json({ error: "Unauthorized" });

    const { type, content, backgroundColor } = req.body;
    const file = req.file; // File từ Multer

    let ipfsHash;
    let mediaUrl; // URL gốc của IPFS (Gateway nội bộ)

    // 2. XỬ LÝ THEO TYPE
    if (type === "Photo" || type === "Video") {
      if (!file) return res.status(400).json({ error: "File is required" });
      
      console.log(`📤 Uploading ${type} to IPFS Desktop...`);
      ipfsHash = await uploadFileToIPFS(file.path);
      mediaUrl = `${IPFS_CONFIG.GATEWAY_URL}/${ipfsHash}`;
      
      // Dọn dẹp file tạm
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    } else if (type === "Text") {
      if (!content || !backgroundColor) {
        return res.status(400).json({ error: "Content & Background required" });
      }
      
      // Với Text, ta upload 1 file JSON chứa nội dung lên IPFS
      const metadata = { owner, type, content, backgroundColor, timestamp: Date.now() };
      ipfsHash = await uploadJSONToIPFS(metadata);
      mediaUrl = null; // Text không có file media

    } else {
      return res.status(400).json({ error: "Invalid Type" });
    }

    // 3. LƯU VÀO MONGODB
    const newStory = await Story.create({
      owner,
      type,
      content: type === "Text" ? content : null,
      backgroundColor: type === "Text" ? backgroundColor : null,
      ipfsHash,
      mediaUrl
    });

    console.log(`✅ Story Created: ${newStory._id}`);

    res.json({ success: true, story: newStory });

  } catch (err) {
    // Xóa file tạm nếu lỗi xảy ra
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Create Story Error:", err);
    res.status(500).json({ error: "Create story failed" });
  }
};

/**
 * GET /api/story/view/:cid
 * Proxy Stream: Đọc từ IPFS Desktop (8080) -> Pipe về Client (3000)
 */
export const viewStoryProxy = async (req, res) => {
  try {
    const { cid } = req.params;
    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}/${cid}`;

    // Gọi IPFS lấy luồng dữ liệu
    const response = await axios.get(ipfsUrl, {
      responseType: 'stream'
    });

    // Copy Content-Type (image/jpeg, video/mp4) trả về cho Client
    if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    // Bơm dữ liệu
    response.data.pipe(res);

  } catch (error) {
    // console.error(`Proxy Error ${req.params.cid}:`, error.message);
    res.status(404).send("File not found on IPFS");
  }
};