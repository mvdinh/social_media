import { create } from 'ipfs-http-client';

const ipfs = create({
    url: process.env.IPFS_API || 'http://127.0.0.1:5001/api/v0',
});

export default ipfs;