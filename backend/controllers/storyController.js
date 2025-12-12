import fs from "fs";
import axios from "axios";
import { uploadFileToIPFS, uploadJSONToIPFS, getIPFSMetadata } from "../services/ipfsService.js";
import { IPFS_CONFIG } from "../config/ipfs.js";

// GET / - List Stories
export const getStories = async (req, res) => {
  try {
    const response = await axios.post(
      `${IPFS_CONFIG.API_URL}/pin/ls`,
      {},
      { params: { type: 'recursive' } }
    );

    const pins = response.data.Keys || {};
    const files = [];

    // Parallel fetch metadata
    const promises = Object.keys(pins).map(async (hash) => {
      const metadata = await getIPFSMetadata(hash);
      if (metadata && (metadata.type?.startsWith('story-'))) {
        files.push({
          ipfsHash: hash,
          name: metadata.owner || "Unknown",
          datePinned: new Date().toISOString(),
          url: `http://localhost:3000/api/story/view/${hash}`,
          type: metadata.type,
          backgroundColor: metadata.backgroundColor || null,
          content: metadata.content || metadata.contentSnippet || null
        });
      }
    });

    await Promise.all(promises);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories from IPFS" });
  }
};

// POST /post - Create Story
export const createStory = async (req, res) => {
  try {
    const { owner, type, content, backgroundColor } = req.body;
    const timestamp = Date.now();
    const file = req.file;

    if (!owner || !type) return res.status(400).json({ error: "Missing fields" });

    let ipfsHash;

    if (type === "Photo" || type === "Video") {
      if (!file) return res.status(400).json({ error: "File required" });
      
      const fileHash = await uploadFileToIPFS(file.path);
      const metadata = {
        owner, timestamp,
        type: type === "Video" ? "story-video" : "story-photo",
        contentHash: fileHash,
        name: `Story by ${owner}`
      };
      
      ipfsHash = await uploadJSONToIPFS(metadata);
      fs.unlinkSync(file.path); // Clean up
    } 
    else if (type === "Text") {
      if (!content || !backgroundColor) return res.status(400).json({ error: "Content requried" });
      
      const textStory = {
        owner, timestamp,
        type: "story-text",
        backgroundColor, content,
        contentSnippet: content.substring(0, 50),
        name: `Text Story by ${owner}`
      };
      ipfsHash = await uploadJSONToIPFS(textStory);
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    res.json({ 
      ipfsHash, 
      owner, timestamp, 
      url: `http://localhost:3000/api/story/view/${ipfsHash}` 
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
};

// GET /view/:cid - Proxy Stream
export const viewStory = async (req, res) => {
  try {
    const { cid } = req.params;
    const ipfsUrl = `${IPFS_CONFIG.GATEWAY_URL}/${cid}`;
    const response = await axios.get(ipfsUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (error) {
    res.status(404).send("File not found");
  }
};