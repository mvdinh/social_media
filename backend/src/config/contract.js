import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

// === __dirname setup ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Load ABI & Address ===
const contractABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./SocialMedia.json"), "utf-8")
);
const contractAddress = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./contract-address.json"), "utf-8")
);

// === Blockchain Config ===
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// === Kết nối provider và signer ===
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// === Kết nối contract ===
const contract = new ethers.Contract(
  contractAddress.SocialMedia,
  contractABI.abi,
  signer
);

// Hàm export để tái sử dụng
export function getProvider() {
  return provider;
}

export function getSigner() {
  return signer;
}

export function getContract() {
  return contract;
}

export async function getSignerAddress() {
  return await signer.getAddress();
}

console.log("✅ Blockchain connected at:", RPC_URL);
getSignerAddress().then(addr => console.log("👛 Signer address:", addr));
