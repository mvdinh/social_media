import express from 'express';
import multer from 'multer';
import { uploadToIPFS, pinCID } from '../services/ipfs.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const cid = await uploadToIPFS(req.file.buffer);
    await pinCID(cid);

    res.json({ cid, url: `https://ipfs.io/ipfs/${cid}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.post('/upload-json', async (req, res) => {
  try {
    const data = req.body;
    const buffer = Buffer.from(JSON.stringify(data));
    const cid = await uploadToIPFS(buffer);
    await pinCID(cid);

    res.json({ cid });
  } catch (error) {
    console.error('JSON upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;