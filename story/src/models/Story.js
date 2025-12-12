import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ABI + contract address
const ABI_PATH = path.join(__dirname, "../../abi.json");
const ADDRESS_PATH = path.join(__dirname, "../../contractAddress.json");

if (!fs.existsSync(ABI_PATH) || !fs.existsSync(ADDRESS_PATH)) {
  throw new Error("ABI or contractAddress.json not found. Deploy contract first!");
}

const abi = JSON.parse(fs.readFileSync(ABI_PATH, "utf-8"));
const { address } = JSON.parse(fs.readFileSync(ADDRESS_PATH, "utf-8"));

// Provider Hardhat
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// **Dùng signer để gửi transaction**
// lấy account đầu tiên từ Hardhat node
const signer = provider.getSigner(0);

// Contract với signer
export const storyContract = new ethers.Contract(address, abi, signer);
