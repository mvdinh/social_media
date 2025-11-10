import express from 'express';
import multer from 'multer';
import ipfsService from '../services/ipfsService.js';

const router = express.Router();

// Configure multer với error handling tốt hơn
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf', 'application/json', 'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed!`), false);
    }
  }
});

// Middleware xử lý lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max size is 50MB' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// 📤 Upload single file
router.post('/upload', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await ipfsService.addFile(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      cid: result.hash,
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// 📤 Upload multiple files
router.post('/upload-multiple', upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const results = await Promise.all(
      req.files.map(file => 
        ipfsService.addFile(file.buffer, file.originalname)
      )
    );

    res.json({
      success: true,
      message: `${results.length} files uploaded successfully`,
      files: results.map((result, index) => ({
        cid: result.hash,
        url: result.url,
        filename: result.filename,
        size: result.size,
        mimeType: req.files[index].mimetype
      }))
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// 📤 Upload JSON data
router.post('/upload-json', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    const result = await ipfsService.addJSON(req.body);

    res.json({
      success: true,
      message: 'JSON uploaded successfully',
      cid: result.hash,
      url: result.url,
      data: result.data
    });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// 📥 Retrieve file from IPFS
router.get('/file/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    const { content, mimeType } = await ipfsService.getFile(cid);

    // Set appropriate headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Disposition', 'inline');
    
    res.send(content);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(404).json({ 
      success: false,
      error: 'Failed to retrieve file', 
      details: error.message 
    });
  }
});

// 📥 Download file from IPFS (force download)
router.get('/download/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const { filename } = req.query;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    const { content, mimeType } = await ipfsService.getFile(cid);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || cid}"`);
    
    res.send(content);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ 
      success: false,
      error: 'Failed to download file', 
      details: error.message 
    });
  }
});

// 📥 Retrieve JSON from IPFS
router.get('/json/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    const data = await ipfsService.getJSON(cid);
    
    res.json({
      success: true,
      cid,
      data
    });
  } catch (error) {
    console.error('JSON retrieval error:', error);
    res.status(404).json({ 
      success: false,
      error: 'Failed to retrieve JSON', 
      details: error.message 
    });
  }
});

// 📌 Pin content
router.post('/pin/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    const result = await ipfsService.pinContent(cid);
    
    res.json({
      success: true,
      message: 'Content pinned successfully',
      ...result
    });
  } catch (error) {
    console.error('Pin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to pin content', 
      details: error.message 
    });
  }
});

// 🔹 Encode text to IPFS
router.post('/encode', async (req, res) => {
  try {
    const { text, metadata } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const data = {
      text,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };

    const result = await ipfsService.addJSON(data);

    res.json({
      success: true,
      message: 'Text saved to IPFS',
      cid: result.hash,
      url: result.url
    });
  } catch (error) {
    console.error('Encode error:', error);
    res.status(500).json({ 
      success: false,
      error: 'IPFS encode failed', 
      details: error.message 
    });
  }
});

// 🔹 Decode text from IPFS
router.post('/decode', async (req, res) => {
  try {
    const { cid } = req.body;
    
    if (!cid) {
      return res.status(400).json({ error: 'No CID provided' });
    }

    const data = await ipfsService.getJSON(cid);

    if (!data || !data.text) {
      return res.status(404).json({ 
        success: false,
        error: 'No text found in this CID' 
      });
    }

    res.json({
      success: true,
      message: 'Text retrieved from IPFS',
      text: data.text,
      metadata: data.metadata || {},
      timestamp: data.timestamp
    });
  } catch (error) {
    console.error('Decode error:', error);
    res.status(500).json({ 
      success: false,
      error: 'IPFS decode failed', 
      details: error.message 
    });
  }
});

// 🔍 Get file info (metadata without downloading)
router.get('/info/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    // Parse CID to validate
    const parsedCID = ipfsService.parseCID(cid);

    res.json({
      success: true,
      cid: parsedCID.toString(),
      url: `ipfs://${parsedCID.toString()}`,
      version: parsedCID.version,
      codec: parsedCID.code
    });
  } catch (error) {
    console.error('Info error:', error);
    res.status(400).json({ 
      success: false,
      error: 'Invalid CID', 
      details: error.message 
    });
  }
});

// 🏥 Health check
router.get('/health', async (req, res) => {
  try {
    await ipfsService.initialize();
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;