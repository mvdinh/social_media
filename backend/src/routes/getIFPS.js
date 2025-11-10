import express from 'express';
import IPFSService from '../services/ipfsService.js'; // import file serviceIPFS
import mime from 'mime-types';

const router = express.Router();

/**
 * GET /ipfs/:cid
 * Lấy file từ Helia/IPFS theo CID
 */
router.get('/:cid', async (req, res) => {
  const { cid } = req.params;

  try {
    // Lấy file từ Helia
    const fileData = await IPFSService.getFile(cid);

    // Set content-type đúng MIME
    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Length', fileData.content.length);

    // Gửi buffer trực tiếp
    res.send(fileData.content);

  } catch (error) {
    console.error('❌ Error fetching IPFS file:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
