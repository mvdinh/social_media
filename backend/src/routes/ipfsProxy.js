import express from "express";
import ipfsService from "../services/ipfsService.js"; // Giả sử service ở ../services/

const router = express.Router();

// GET /api/ipfs/:hash (Lưu ý: đường dẫn sẽ là /:hash
// vì ta sẽ mount router này tại /api/ipfs)
router.get("/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({ error: "No hash provided" });
    }

    // 1. Lấy file buffer từ service Helia
    const { content: buffer } = await ipfsService.getFile(hash);

    // 2. Tự động nhận diện Mime-Type (cần cài 'file-type')
    const { fileTypeFromBuffer } = await import('file-type');
    const typeInfo = await fileTypeFromBuffer(buffer);
    
    let mimeType = 'application/octet-stream'; // Mặc định
    if (typeInfo) {
      mimeType = typeInfo.mime;
    }

    console.log(`[PROXY] Streaming file: ${hash} -> ${mimeType}`);

    // 3. Trả file về cho trình duyệt
    res.setHeader('Content-Type', mimeType);
    // Set Cache-Control (nội dung IPFS là bất biến)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); 
    res.send(buffer);

  } catch (err) {
    console.error(`❌ Error serving IPFS file ${req.params.hash}:`, err.message);
    res.status(404).json({ error: "File not found or invalid CID" });
  }
});

export default router;