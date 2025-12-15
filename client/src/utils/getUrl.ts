export default function getUrl(cid: string): string {
  return import.meta.env.VITE_IPFS_GATEWAY_URL  + cid;
}