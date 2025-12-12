import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { IPFS_CONFIG } from "../config/ipfs.js";

/**
 * ======================================
 * 🔵 1. UPLOAD FILE (Ảnh / Video)
 * ======================================
 */
export const uploadFileToIPFS = async (filePath) => {
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const res = await axios.post(
      `${IPFS_CONFIG.API_URL}/add`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const hash = res.data.Hash;

    // Pin file để không bị xóa
    await axios.post(
      `${IPFS_CONFIG.API_URL}/pin/add?arg=${hash}`
    );

    console.log(`📌 Pinned: ${hash}`);
    return hash;

  } catch (err) {
    console.error("❌ File Upload Error:", err.message);
    if (err.code === "ECONNREFUSED") {
      throw new Error("IPFS Desktop is OFFLINE!");
    }
    throw err;
  }
};


/**
 * ======================================
 * 🟢 2. UPLOAD JSON (Sửa lỗi hoàn toàn)
 * ======================================
 */
export const uploadJSONToIPFS = async (jsonData) => {
  try {
    const formData = new FormData();
    const jsonString = JSON.stringify(jsonData);

    formData.append(
      "file",
      Buffer.from(jsonString),
      {
        filename: "metadata.json",
        contentType: "application/json"
      }
    );

    const res = await axios.post(
      `${IPFS_CONFIG.API_URL}/add`,
      formData,
      {
        headers: formData.getHeaders(),
        params: {
          pin: true,
          "wrap-with-directory": false
        }
      }
    );

    return res.data.Hash;

  } catch (err) {
    console.error("❌ JSON Upload Error:", err.message);
    throw err;
  }
};


/**
 * ======================================
 * 🟡 3. LẤY METADATA JSON TRÊN IPFS
 * ======================================
 */
export const getIPFSMetadata = async (hash) => {
  try {
    const res = await axios.get(`${IPFS_CONFIG.GATEWAY_URL}/${hash}`);
    return res.data;
  } catch (err) {
    console.log(`⚠️ Cannot fetch metadata from IPFS: ${hash}`);
    return null;
  }
};
