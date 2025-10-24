export const gatewayUrl = (cid) => {
    const base = process.env.GATEWAY_BASE || 'https://ipfs.io/ipfs';
    // base ở dạng ".../ipfs"
    return `${base}/${cid}`;
};