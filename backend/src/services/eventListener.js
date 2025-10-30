import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { json } from '@helia/json';
import { MemoryBlockstore } from 'blockstore-core';
import { MemoryDatastore } from 'datastore-core';

class IPFSService {
  constructor() {
    this.helia = null;
    this.fs = null;
    this.jsonStore = null;
  }

  async init() {
    if (this.helia) return;
    
    this.helia = await createHelia({
      blockstore: new MemoryBlockstore(),
      datastore: new MemoryDatastore()
    });

    this.fs = unixfs(this.helia);
    this.jsonStore = json(this.helia);
  }

  async addFile(buffer, filename) {
    await this.init();
    const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const cid = await this.fs.addBytes(uint8Array);
    
    return {
      hash: cid.toString(),
      url: `ipfs://${cid.toString()}`,
      filename,
      size: uint8Array.length
    };
  }

  async addJSON(data) {
    await this.init();
    const cid = await this.jsonStore.add(data);
    
    return {
      hash: cid.toString(),
      url: `ipfs://${cid.toString()}`,
      data
    };
  }

  async getFile(hash) {
    await this.init();
    const decoder = new TextDecoder();
    let content = '';
    
    for await (const chunk of this.fs.cat(hash)) {
      content += decoder.decode(chunk, { stream: true });
    }
    
    return content;
  }

  async getJSON(hash) {
    await this.init();
    return await this.jsonStore.get(hash);
  }

  async addMultipleFiles(files) {
    await this.init();
    return await Promise.all(
      files.map(file => this.addFile(file.buffer, file.filename))
    );
  }

  async stop() {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
      this.fs = null;
      this.jsonStore = null;
    }
  }
}

export default new IPFSService();