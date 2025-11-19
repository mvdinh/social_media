import { create } from "ipfs-http-client";
import { Buffer } from "buffer";

// Kết nối IPFS Local Node (API port 5001)
const ipfs = create({ host: "localhost", port: 5001, protocol: "http" });

/**
 * Upload text content to IPFS
 * @param {string} text - Text content
 * @returns {Promise<string>} - CID
 */
export const uploadTextToIpfs = async (text: string): Promise<string> => {
  if (!text?.trim()) throw new Error("Text content is empty");

  try {
    const buffer = Buffer.from(text, "utf-8");
    const result = await ipfs.add(buffer);
    console.log("📝 Text uploaded to IPFS:", result.cid.toString());
    return result.cid.toString();
  } catch (error: any) {
    console.error("Error uploading text to IPFS:", error);
    throw new Error(`Upload text failed: ${error.message}`);
  }
};

/**
 * Upload single file (image/video) to IPFS
 * @param {File} file - File object
 * @returns {Promise<string>} - CID
 */
export const uploadFileToIpfs = async (file: File): Promise<string> => {
  if (!file) throw new Error("No file provided");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await ipfs.add(buffer);
    console.log(`📁 File uploaded: ${file.name} -> ${result.cid.toString()}`);
    return result.cid.toString();
  } catch (error: any) {
    console.error(`Error uploading file ${file.name}:`, error);
    throw new Error(`Upload file failed: ${error.message}`);
  }
};

/**
 * Upload multiple files to IPFS
 * @param {File[]} files - Array of File objects
 * @returns {Promise<string[]>} - Array of CIDs
 */
export const uploadMultipleFilesToIpfs = async (files: File[]): Promise<string[]> => {
  if (!files?.length) return [];

  try {
    const cids = await Promise.all(files.map(f => uploadFileToIpfs(f)));
    console.log(`📁 ${files.length} files uploaded to IPFS`);
    return cids;
  } catch (error: any) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Upload multiple files failed: ${error.message}`);
  }
};

/**
 * Retrieve content from IPFS
 * @param {string} cid - CID of content
 * @returns {Promise<string>} - Content as string
 */
export const getFromIpfs = async (cid: string): Promise<string> => {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
  } catch (error: any) {
    console.error(`Error retrieving CID ${cid}:`, error);
    throw new Error(`Retrieve from IPFS failed: ${error.message}`);
  }
};
