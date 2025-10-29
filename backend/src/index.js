import express from 'express';
import cors from 'cors';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';

const app = express();
let heliaNode, fs;

// Initialize Helia
async function initHelia() {
  heliaNode = await createHelia();
  fs = unixfs(heliaNode);
  console.log('Helia node started');
}

app.use(cors());
app.use(express.json());

// Upload content to IPFS via Helia
app.post('/api/ipfs/upload', async (req, res) => {
  try {
    const { content } = req.body;
    const encoder = new TextEncoder();
    const bytes = encoder.encode(JSON.stringify(content));

    const cid = await fs.addBytes(bytes);

    res.json({
      success: true,
      ipfsHash: cid.toString(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve content from IPFS via Helia
app.get('/api/ipfs/:cid', async (req, res) => {
  try {
    const cid = CID.parse(req.params.cid);
    const decoder = new TextDecoder();
    let content = '';

    for await (const chunk of fs.cat(cid)) {
      content += decoder.decode(chunk, { stream: true });
    }

    res.json({
      success: true,
      content: JSON.parse(content),
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', helia: !!heliaNode });
});

const PORT = process.env.PORT || 3001;

initHelia()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch(console.error);

process.on('SIGINT', async () => {
  if (heliaNode) {
    await heliaNode.stop();
    console.log('Helia node stopped');
  }
  process.exit(0);
});


