import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface PostData {
  content: string;
  author: string;
  timestamp: number;
}

interface UploadResult {
  contentHash: string;
  mediaHashes: string[];
}

export const uploadToIpfs = async (
  content: string,
  account: string,
  files: File[] = []
): Promise<UploadResult> => {
  console.log('📤 Step 4: Uploading content to IPFS...');

  // Step 4: Upload post content as JSON
  const postData: PostData = { 
    content, 
    author: account, 
    timestamp: Date.now(),
  };

  const contentResponse = await axios.post(`${API_URL}/ipfs/upload-json`, postData);
  const contentHash = contentResponse.data.cid;
  console.log('✅ Content uploaded to IPFS:', contentHash);

  // Step 5: Upload media files (if any)
  let mediaHashes: string[] = [];

  if (files.length > 0) {
    console.log(`📤 Step 5: Uploading ${files.length} media files...`);
    
    const uploadPromises = files.map(async (file, index) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/ipfs/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log(`✅ File ${index + 1}/${files.length} uploaded:`, response.data.cid);
      return response.data.cid;
    });

    mediaHashes = await Promise.all(uploadPromises);
  }

  return { contentHash, mediaHashes };
};
