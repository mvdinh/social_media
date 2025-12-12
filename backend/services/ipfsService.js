import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { IPFS_CONFIG } from "../config/ipfs.js";

// Upload File
export const uploadFileToIPFS = async (filePath) => {
  try {
    const fileStream = fs.createReadStream(filePath);
    const formData = new FormData();
    formData.append('file', fileStream);

    const uploadResponse = await axios.post(
      `${IPFS_CONFIG.API_URL}/add`,
      formData,
      {
        headers: { ...formData.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const ipfsHash = uploadResponse.data.Hash;

    // Pin file
    await axios.post(
      `${IPFS_CONFIG.API_URL}/pin/add?arg=${ipfsHash}`,
      {},
      { params: { recursive: true } }
    );

    console.log(`✅ File pinned: ${ipfsHash}`);
    return ipfsHash;
  } catch (error) {
    console.error("❌ IPFS Upload Error:", error.message);
    if (error.code === 'ECONNREFUSED') throw new Error("IPFS Desktop is offline!");
    throw error;
  }
};

// Upload JSON
export const uploadJSONToIPFS = async (jsonData) => {
  try {
    const response = await axios.post(
      `${IPFS_CONFIG.API_URL}/add`,
      JSON.stringify(jsonData),
      {
        headers: { 'Content-Type': 'application/json' },
        params: { 'pin': true, 'wrap-with-directory': false }
      }
    );
    return response.data.Hash;
  } catch (error) {
    console.error("❌ IPFS JSON Error:", error.message);
    throw error;
  }
};

// Get Metadata
export const getIPFSMetadata = async (hash) => {
  try {
    const response = await axios.get(`${IPFS_CONFIG.GATEWAY_URL}/${hash}`, { timeout: 5000 });
    return response.data;
  } catch (err) {
    console.log(`⚠️ Metadata fetch failed for ${hash}`);
    return null;
  }
};