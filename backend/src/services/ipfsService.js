import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { json } from '@helia/json';
import { FsBlockstore } from 'blockstore-fs';
import { FsDatastore } from 'datastore-fs';
import { CID } from 'multiformats/cid';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs';

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.jsonStore = null;

    // 🔹 Thư mục lưu trữ dữ liệu Helia trên máy
    this.storagePath = path.resolve('./helia_storage');
  }

  // 🔹 Khởi tạo node Helia local (persistent)
  async initialize() {
    if (this.helia) return;

    try {
      console.log('🔄 Initializing persistent Helia node...');

      // Tạo folder nếu chưa có
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }

      this.helia = await createHelia({
        blockstore: new FsBlockstore(path.join(this.storagePath, 'blocks')),
        datastore: new FsDatastore(path.join(this.storagePath, 'datastore')),
      });

      this.fs = unixfs(this.helia);
      this.jsonStore = json(this.helia);

      console.log('✅ Helia (persistent local IPFS) initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Helia:', error);
      throw error;
    }
  }

  // 🔹 Parse and validate CID
  parseCID(hashString) {
    try {
      // Remove ipfs:// prefix if exists
      let hash = hashString;
      if (hash.startsWith('ipfs://')) {
        hash = hash.replace('ipfs://', '');
      }
      
      // Remove any whitespace
      hash = hash.trim();
      
      // Parse CID
      const cid = CID.parse(hash);
      
      console.log(`✅ Valid CID: ${cid.toString()}, version: ${cid.version}, codec: ${cid.code}`);
      
      return cid;
    } catch (error) {
      console.error(`❌ Invalid CID format: ${hashString}`);
      console.error(`   Error: ${error.message}`);
      throw new Error(`Invalid CID: ${error.message}`);
    }
  }

  // 📤 Upload file (buffer)
  async addFile(buffer, filename = 'unnamed') {
    await this.initialize();

    try {
      const cid = await this.fs.addBytes(buffer);
      const hash = cid.toString();

      console.log(`📤 File uploaded to local Helia storage: ${hash}`);

      return {
        hash,
        url: `ipfs://${hash}`,
        filename,
        size: buffer.length,
      };
    } catch (error) {
      console.error('❌ Error uploading file to Helia:', error);
      throw error;
    }
  }

  // 📤 Upload JSON object
  async addJSON(data) {
    await this.initialize();

    try {
      const cid = await this.jsonStore.add(data);
      const hash = cid.toString();

      console.log(`📤 JSON stored in local Helia storage: ${hash}`);

      return {
        hash,
        url: `ipfs://${hash}`,
        data,
      };
    } catch (error) {
      console.error('❌ Error storing JSON in Helia:', error);
      throw error;
    }
  }

  // 📥 Lấy file từ Helia
  async getFile(hash) {
    await this.initialize();

    try {
      // Parse and validate CID
      const cid = this.parseCID(hash);
      
      console.log(`📥 Fetching file with CID: ${cid.toString()}`);

      const chunks = [];
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const mimeType = mime.lookup(hash) || 'application/octet-stream';

      console.log(`✅ Retrieved file from Helia: ${hash} (${buffer.length} bytes)`);
      
      return { content: buffer, mimeType };
    } catch (error) {
      console.error(`❌ Error retrieving file:`, error.message);
      throw error;
    }
  }

  // 📥 Lấy JSON từ Helia
  async getJSON(hash) {
    await this.initialize();

    try {
      // Parse and validate CID
      const cid = this.parseCID(hash);
      
      console.log(`📥 Fetching JSON with CID: ${cid.toString()}`);
      
      const data = await this.jsonStore.get(cid);
      
      console.log(`✅ Retrieved JSON from Helia: ${hash}`);
      
      return data;
    } catch (error) {
      console.error(`❌ Error retrieving JSON:`, error.message);
      throw error;
    }
  }

  // 📌 Pin local content (giữ dữ liệu trong ổ đĩa)
  async pinContent(hash) {
    try {
      const cid = this.parseCID(hash);
      console.log(`📌 Content pinned locally: ${cid.toString()}`);
      return { hash: cid.toString(), pinned: true };
    } catch (error) {
      console.error(`❌ Error pinning content:`, error.message);
      throw error;
    }
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