// backend/routes/testIpfs.js
import express from 'express';
import ipfsService from '../services/ipfsService.js';

const router = express.Router();

// 📤 Mã hóa: lưu chuỗi text lên Helia/IPFS
router.post('/encode', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    // Lưu chuỗi text lên IPFS (dưới dạng JSON)
    const result = await ipfsService.addJSON({ text });

    res.json({
      message: 'Text saved to IPFS',
      cid: result.hash,
      url: result.url,
    });
  } catch (error) {
    res.status(500).json({ error: 'IPFS encode failed', details: error.message });
  }
});

// 📥 Giải mã: lấy text từ CID
router.post('/decode', async (req, res) => {
  try {
    const { cid } = req.body;
    if (!cid) return res.status(400).json({ error: 'No CID provided' });

    // Lấy dữ liệu JSON từ IPFS
    const data = await ipfsService.getJSON(cid);

    res.json({
      message: 'Text retrieved from IPFS',
      text: data.text,
    });
  } catch (error) {
    res.status(500).json({ error: 'IPFS decode failed', details: error.message });
  }
});

export default router;
