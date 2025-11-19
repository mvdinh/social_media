import { create } from "ipfs-http-client";

// Kết nối IPFS - hỗ trợ IPFS Desktop và CLI
let ipfs: any;

const IPFS_CONFIGS = [
  // IPFS Desktop default
  { host: "127.0.0.1", port: 5001, protocol: "http" },
  // IPFS CLI default
  { host: "localhost", port: 5001, protocol: "http" },
];

/**
 * Initialize IPFS client with auto-detection
 */
const initIPFS = async () => {
  if (ipfs) return ipfs;
  
  for (const config of IPFS_CONFIGS) {
    try {
      console.log(`🔍 Trying IPFS at ${config.host}:${config.port}...`);
      
      const client = create({ 
        ...config,
        timeout: 10000
      });
      
      // Test connection
      const version = await client.version();
      console.log(`✅ IPFS connected! Version: ${version.version}`);
      console.log(`📍 Using: ${config.protocol}://${config.host}:${config.port}`);
      
      ipfs = client;
      return client;
      
    } catch (error: any) {
      console.warn(`❌ Failed to connect to ${config.host}:${config.port}`, error.message);
      continue;
    }
  }
  
  throw new Error(
    "Cannot connect to IPFS.\n\n" +
    "Please make sure IPFS Desktop is running!\n\n" +
    "Steps:\n" +
    "1. Open IPFS Desktop app\n" +
    "2. Ensure status shows 'Running'\n" +
    "3. Check Settings → IPFS Config → API port (should be 5001)"
  );
};

/**
 * Upload text content to IPFS
 * @param {string} text - Text content
 * @returns {Promise<string>} - CID
 */
export const uploadTextToIpfs = async (text: string): Promise<string> => {
  if (!text?.trim()) {
    throw new Error("Text content is empty");
  }

  try {
    // Ensure IPFS client is initialized
    const client = ipfs || await initIPFS();
    
    console.log("📤 Uploading text to IPFS...", text.substring(0, 50) + "...");
    
    // Convert text to Uint8Array (no Buffer needed)
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const result = await client.add(data, {
      progress: (prog: number) => console.log(`📊 Upload progress: ${prog} bytes`)
    });
    
    const cid = result.cid.toString();
    
    console.log("✅ Text uploaded to IPFS:", cid);
    return cid;
    
  } catch (error: any) {
    console.error("❌ Error uploading text to IPFS:", error);
    
    if (error.message?.includes("Cannot connect to IPFS")) {
      throw error;
    }
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      throw new Error(
        "Cannot connect to IPFS Desktop.\n\n" +
        "Please check:\n" +
        "1. IPFS Desktop app is running\n" +
        "2. Status shows 'Running' (not 'Stopped')\n" +
        "3. API is accessible at http://127.0.0.1:5001"
      );
    }
    
    if (error.code === 'ETIMEDOUT') {
      throw new Error("IPFS request timeout. Try restarting IPFS Desktop");
    }
    
    throw new Error(`Upload text failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Upload single file (image/video) to IPFS
 * @param {File} file - File object
 * @returns {Promise<string>} - CID
 */
export const uploadFileToIpfs = async (file: File): Promise<string> => {
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    // Ensure IPFS client is initialized
    const client = ipfs || await initIPFS();
    
    console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)...`);

    // Convert File to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const result = await client.add(uint8Array, {
      progress: (prog: number) => console.log(`📊 ${file.name}: ${(prog / 1024).toFixed(2)} KB`)
    });
    
    const cid = result.cid.toString();
    
    console.log(`✅ File uploaded: ${file.name} -> ${cid}`);
    return cid;
    
  } catch (error: any) {
    console.error(`Error uploading file ${file.name}:`, error);
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error("Cannot connect to IPFS Desktop. Please check if it's running.");
    }
    
    throw new Error(`Upload file ${file.name} failed: ${error.message || 'Unknown error'}`);
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
    console.log(`📤 Uploading ${files.length} files to IPFS...`);
    
    const cids = await Promise.all(files.map(f => uploadFileToIpfs(f)));
    
    console.log(`✅ ${files.length} files uploaded to IPFS`);
    return cids;
    
  } catch (error: any) {
    console.error("Error uploading multiple files:", error);
    throw new Error(`Upload multiple files failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Retrieve content from IPFS
 * @param {string} cid - CID of content
 * @returns {Promise<string>} - Content as string
 */
export const getFromIpfs = async (cid: string): Promise<string> => {
  try {
    const client = ipfs || await initIPFS();
    
    console.log(`📥 Retrieving from IPFS: ${cid}`);
    
    const chunks: Uint8Array[] = [];
    
    for await (const chunk of client.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Merge all chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Decode to string
    const decoder = new TextDecoder();
    const content = decoder.decode(merged);
    
    console.log(`✅ Retrieved from IPFS: ${content.substring(0, 50)}...`);
    
    return content;
    
  } catch (error: any) {
    console.error(`Error retrieving CID ${cid}:`, error);
    throw new Error(`Retrieve from IPFS failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Check IPFS connection status
 * @returns {Promise<boolean>} - True if connected
 */
export const checkIPFSConnection = async (): Promise<boolean> => {
  try {
    const client = ipfs || await initIPFS();
    const version = await client.version();
    console.log("✅ IPFS is connected:", version);
    return true;
  } catch (error: any) {
    console.error("❌ IPFS is not connected:", error.message);
    return false;
  }
};

// Try to initialize on module load
initIPFS().catch(err => {
  console.warn("⚠️ IPFS will be initialized on first use:", err.message);
});