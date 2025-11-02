// backend/routes/ipfs.js
import express from 'express';
import multer from 'multer';
import ipfsService from '../services/ipfsService.js';

const router = express.Router();

// Configure multer với limits và error handling
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// 📤 Upload file lên Helia (local IPFS)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Received file upload request');
    
    if (!req.file) {
      console.error('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log(`📁 File: ${req.file.originalname}, Size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

    const result = await ipfsService.addFile(req.file.buffer, req.file.originalname);

    console.log(`✅ File uploaded successfully: ${result.hash}`);

    res.json({
      message: 'File uploaded successfully',
      cid: result.hash,
      url: `ipfs://${result.hash}`,
      filename: result.filename,
      size: result.size,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// 📤 Upload JSON lên Helia (local IPFS)
router.post('/upload-json', async (req, res) => {
  try {
    console.log('📥 Received JSON upload request');
    console.log('📦 Data:', req.body);
    
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      console.error('❌ No data provided');
      return res.status(400).json({ error: 'No data provided' });
    }

    const result = await ipfsService.addJSON(data);

    console.log(`✅ JSON uploaded successfully: ${result.hash}`);

    res.json({
      message: 'JSON uploaded successfully',
      cid: result.hash,
      url: `ipfs://${result.hash}`,
      data: result.data,
    });
  } catch (error) {
    console.error('❌ JSON upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// 📥 Lấy file từ IPFS
router.get('/file/:cid', async (req, res) => {
  try {
    console.log(`📥 Fetching file: ${req.params.cid}`);
    
    const { content, mimeType } = await ipfsService.getFile(req.params.cid);
    
    res.setHeader('Content-Type', mimeType);
    res.send(content);
    
    console.log(`✅ File sent: ${req.params.cid}`);
  } catch (error) {
    console.error('❌ Get file error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve file',
      details: error.message 
    });
  }
});

// 📥 Lấy JSON từ IPFS
router.get('/json/:cid', async (req, res) => {
  try {
    console.log(`📥 Fetching JSON: ${req.params.cid}`);
    
    const data = await ipfsService.getJSON(req.params.cid);
    
    res.json(data);
    
    console.log(`✅ JSON sent: ${req.params.cid}`);
  } catch (error) {
    console.error('❌ Get JSON error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve JSON',
      details: error.message 
    });
  }
});

// 📌 Pin nội dung local (giữ dữ liệu trong memory)
router.post('/pin/:cid', async (req, res) => {
  try {
    console.log(`📌 Pinning: ${req.params.cid}`);
    
    const result = await ipfsService.pinContent(req.params.cid);
    
    res.json(result);
    
    console.log(`✅ Pinned: ${req.params.cid}`);
  } catch (error) {
    console.error('❌ Pin error:', error);
    res.status(500).json({ 
      error: 'Failed to pin content',
      details: error.message 
    });
  }
});





export default router;