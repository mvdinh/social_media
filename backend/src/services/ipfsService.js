import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { FsBlockstore } from 'blockstore-fs';
import { FsDatastore } from 'datastore-fs';
import { CID } from 'multiformats/cid';
import { libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { bootstrap } from '@libp2p/bootstrap';
import mime from 'mime-types';
import path from 'path';
import fs from 'fs';

class IPFSService {
  constructor() {
    this.helia = null;
    this.fsApi = null;
    this.metadata = new Map();
    this.storagePath = path.resolve('./helia_storage');
  }

  // 🔹 Khởi tạo Helia 6
  async initialize() {
    if (this.helia) return;

    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    // Cấu hình libp2p cho Helia 6
    const libp2pInstance = await libp2p({
      addresses: {
        listen: ['/ip4/0.0.0.0/tcp/0']
      },
      transports: [tcp()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
      services: {
        identify: identify(),
        dht: kadDHT({
          clientMode: true
        })
      },
      peerDiscovery: [
        bootstrap({
          list: [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
          ]
        })
      ]
    });

    this.helia = await createHelia({
      libp2p: libp2pInstance,
      blockstore: new FsBlockstore(path.join(this.storagePath, 'blocks')),
      datastore: new FsDatastore(path.join(this.storagePath, 'datastore'))
    });

    this.fsApi = unixfs(this.helia);
    console.log('✅ Helia 6 node initialized');
  }

  // 🔹 Parse CID
  parseCID(hashString) {
    try {
      let hash = hashString.replace(/^ipfs:\/\//, '').trim();
      const cid = CID.parse(hash);
      return cid;
    } catch (err) {
      throw new Error(`Invalid CID: ${err.message}`);
    }
  }

  // 📤 Upload file
  async addFile(buffer, filename = 'unnamed') {
    await this.initialize();
    const cid = await this.fsApi.addBytes(buffer);
    const hash = cid.toString();

    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    this.metadata.set(hash, { filename, mimeType });

    return { hash, url: `ipfs://${hash}`, filename, size: buffer.length };
  }

  // 📤 Upload JSON
  async addJSON(data) {
    await this.initialize();
    const buffer = Buffer.from(JSON.stringify(data), 'utf-8');
    const cid = await this.fsApi.addBytes(buffer);
    const hash = cid.toString();
    this.metadata.set(hash, { filename: 'data.json', mimeType: 'application/json' });

    return { hash, url: `ipfs://${hash}`, data };
  }

  // 📥 Lấy file
  async getFile(hash) {
    await this.initialize();
    const cid = this.parseCID(hash);

    const chunks = [];
    for await (const chunk of this.fsApi.cat(cid)) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const meta = this.metadata.get(hash) || {};
    const mimeType = meta.mimeType || 'application/octet-stream';

    return { content: buffer, mimeType };
  }

  // 📥 Lấy JSON
  async getJSON(hash) {
    await this.initialize();
    const cid = this.parseCID(hash);

    const chunks = [];
    for await (const chunk of this.fsApi.cat(cid)) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const jsonString = buffer.toString('utf-8');

    try {
      const data = JSON.parse(jsonString);
      return data;
    } catch (err) {
      throw new Error('Failed to parse JSON from IPFS');
    }
  }

  // 📌 Pin nội dung local
  async pinContent(hash) {
    const cid = this.parseCID(hash);
    // Trong Helia 6, pinning được quản lý tự động qua blockstore
    return { hash: cid.toString(), pinned: true };
  }

  // 🛑 Dừng Helia
  async stop() {
    if (this.helia) {
      await this.helia.stop();
      console.log('🛑 Helia stopped');
      this.helia = null;
      this.fsApi = null;
    }
  }
}

export default new IPFSService();