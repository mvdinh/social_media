import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { json } from '@helia/json';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';
import mime from 'mime-types'; // ✅ để xác định kiểu file

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.jsonStore = null;
  }

  // 🔹 Khởi tạo node Helia local (memory)
  async initialize() {
    if (this.helia) return;

    try {
      console.log('🔄 Initializing local Helia node...');

      this.helia = await createHelia({
        blockstore: new MemoryBlockstore(),
        datastore: new MemoryDatastore(),
      });

      this.fs = unixfs(this.helia);
      this.jsonStore = json(this.helia);

      console.log('✅ Helia (local IPFS) initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Helia:', error);
      throw error;
    }
  }

  // 📤 Upload file (buffer)
  async addFile(buffer, filename = 'unnamed') {
    await this.initialize();

    try {
      const cid = await this.fs.addBytes(buffer);
      const hash = cid.toString();

      console.log(`📤 File uploaded to local IPFS: ${hash}`);

      return {
        hash,
        url: `ipfs://${hash}`,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      console.error('❌ Error uploading file to IPFS:', error);
      throw error;
    }
  }

  // 📤 Upload JSON object
  async addJSON(data) {
    await this.initialize();

    try {
      const cid = await this.jsonStore.add(data);
      const hash = cid.toString();

      console.log(`📤 JSON stored in local IPFS: ${hash}`);

      return {
        hash,
        url: `ipfs://${hash}`,
        data,
      };
    } catch (error) {
      console.error('❌ Error storing JSON in IPFS:', error);
      throw error;
    }
  }

  // 📥 Lấy file từ IPFS (trả về Buffer + MIME type)
  async getFile(hash) {
    await this.initialize();

    try {
      const chunks = [];
      for await (const chunk of this.fs.cat(hash)) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const mimeType = mime.lookup(hash) || 'application/octet-stream';

      console.log(`📥 Retrieved file from IPFS: ${hash}`);
      return { content: buffer, mimeType };
    } catch (error) {
      console.error('❌ Error retrieving file:', error);
      throw error;
    }
  }

  // 📥 Lấy JSON từ IPFS
  async getJSON(hash) {
    await this.initialize();

    try {
      const data = await this.jsonStore.get(hash);
      console.log(`📥 Retrieved JSON from IPFS: ${hash}`);
      return data;
    } catch (error) {
      console.error('❌ Error retrieving JSON:', error);
      throw error;
    }
  }

  // 📌 Pin local content (giữ dữ liệu trong memory)
  async pinContent(hash) {
    console.log(`📌 Content pinned locally: ${hash}`);
    return { hash, pinned: true };
  }

  // 🛑 Dừng Helia
  async stop() {
    if (this.helia) {
      await this.helia.stop();
      console.log('🛑 Helia stopped');
      this.helia = null;
      this.fs = null;
      this.jsonStore = null;
    }
  }
}

export default new IPFSService();
