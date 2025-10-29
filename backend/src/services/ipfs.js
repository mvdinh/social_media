import { create } from 'ipfs-http-client';

const ipfs = create({ url: process.env.IPFS_API });

export const uploadToIPFS = async (buffer) => {
  try {
    const result = await ipfs.add(buffer);
    return result.cid.toString();
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
};

export const getFromIPFS = async (cid) => {
  try {
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return JSON.parse(buffer.toString());
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw error;
  }
};

export const pinCID = async (cid) => {
  try {
    await ipfs.pin.add(cid);
    return true;
  } catch (error) {
    console.error('IPFS pin error:', error);
    return false;
  }
};