// scripts/deployProfile.js
import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Tạo __dirname cho ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Profile contract...");

  // 1. Deploy contract Profile
  const Profile = await hre.ethers.getContractFactory("Profile");
  const profile = await Profile.deploy();
  await profile.waitForDeployment();

  console.log("✅ Profile deployed to:", profile.target);

  // 2. Lấy ABI chuẩn ethers v6
  const abiString = profile.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  // 3. Đường dẫn lưu file JSON cho frontend
  const frontendPath = path.join(
    __dirname,
    "../../client/src/contracts/profile.json"
  );

  // 4. Tạo object lưu address + abi
  const data = {
    address: profile.target,
    abi,
  };

  // 5. Tạo folder nếu chưa tồn tại
  fs.mkdirSync(path.dirname(frontendPath), { recursive: true });

  // 6. Ghi file JSON
  fs.writeFileSync(frontendPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved to frontend:", frontendPath);
}

// Chạy main
main().catch((error) => {
  console.error("❌ Deploy failed:", error);
  process.exitCode = 1;
});
