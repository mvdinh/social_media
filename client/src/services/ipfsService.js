import { create } from 'ipfs-http-client';

class IPFSService {
  constructor() {
    // Sử dụng Infura IPFS
    const projectId = import.meta.env.VITE_INFURA_IPFS_PROJECT_ID;
    const projectSecret = import.meta.env.VITE_INFURA_IPFS_PROJECT_SECRET;

    const auth = 'Basic ' + btoa(projectId + ':' + projectSecret);

    this.client = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth
      }
    });

    // Hoặc sử dụng local IPFS node
    // this.client = create({ url: 'http://127.0.0.1:5001/api/v0' });
  }

  async uploadJSON(data) {
    try {
      const json = JSON.stringify(data);
      const result = await this.client.add(json);
      console.log('✅ Uploaded to IPFS:', result.path);
      return result.path;
    } catch (error) {
      console.error('❌ IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  async uploadFile(file) {
    try {
      const result = await this.client.add(file);
      console.log('✅ File uploaded to IPFS:', result.path);
      return result.path;
    } catch (error) {
      console.error('❌ IPFS file upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async getJSON(hash) {
    try {
      const url = `https://ipfs.io/ipfs/${hash}`;
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ IPFS fetch error:', error);
      throw new Error('Failed to fetch from IPFS');
    }
  }

  getIPFSUrl(hash) {
    return `https://ipfs.io/ipfs/${hash}`;
  }

  // Gateway alternatives
  getGatewayUrl(hash, gateway = 'ipfs.io') {
    const gateways = {
      'ipfs.io': `https://ipfs.io/ipfs/${hash}`,
      'cloudflare': `https://cloudflare-ipfs.com/ipfs/${hash}`,
      'pinata': `https://gateway.pinata.cloud/ipfs/${hash}`,
      'infura': `https://infura-ipfs.io/ipfs/${hash}`
    };
    return gateways[gateway] || gateways['ipfs.io'];
  }
}

export default new IPFSService();