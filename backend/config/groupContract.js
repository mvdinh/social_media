import { ethers } from "ethers";
import dotenv from "dotenv";

// 1. Load biến môi trường từ file .env
dotenv.config();

// 2. Kiểm tra biến môi trường quan trọng
if (!process.env.RPC_URL || !process.env.GROUP_CONTRACT_ADDRESS) {
  console.error("❌ Missing RPC_URL or GROUP_CONTRACT_ADDRESS in .env file");
  process.exit(1); // Dừng server nếu thiếu config
}

// 3. Khởi tạo Provider (Kết nối Blockchain)
// RPC_URL ví dụ: http://127.0.0.1:8545 (Local) hoặc https://bsc-dataseed.binance.org/ (Mainnet)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 4. ABI
// Lưu ý: Tên hàm ở đây PHẢI KHỚP 100% với trong Smart Contract Solidity
const abi = [
  // Events (Cần thiết nếu bạn muốn listen event sau này)
  "event GroupCreated(uint256 indexed groupId, address indexed owner)",
  
  // Read Functions (Backend dùng chủ yếu các hàm này)
  "function checkMembership(uint256 groupId, address user) view returns (bool)", 
  "function isMember(uint256 groupId, address user) view returns (bool)", // Check lại xem contract dùng tên nào?
  "function checkAdmin(uint256 groupId, address user) view returns (bool)",
  "function checkOwnership(uint256 groupId, address user) view returns (bool)"
];

// 5. Export hàm lấy Contract Instance
export const getReadContract = () => {
  return new ethers.Contract(
    process.env.GROUP_CONTRACT_ADDRESS,
    abi,
    provider
  ); // <-- Đã sửa lỗi thiếu dấu ngoặc đóng ở đây
};