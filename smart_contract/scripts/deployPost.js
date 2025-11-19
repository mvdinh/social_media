import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying SocialMedia contract...");

  // Deploy contract
  const SocialMedia = await hre.ethers.getContractFactory("SocialMedia");
  const social = await SocialMedia.deploy();
  await social.waitForDeployment();

  console.log("✅ SocialMedia deployed to:", social.target);

  // ============================
  // Save ABI + Address cho backend + frontend
  // ============================

  const backendConfPath = path.join(
    __dirname,
    "../../backend/src/bloc/socialMedia.json"
  );
  const frontendConfPath = path.join(
    __dirname,
    "../../client/src/bloc/socialMedia.json"
  );

  // Lấy ABI đúng chuẩn ethers v6
  const abiString = social.interface.format("json");
  const abi =
    typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: social.target,
    abi,
  };

  // Tạo folder nếu chưa tồn tại
  fs.mkdirSync(path.dirname(backendConfPath), { recursive: true });
  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });

  // Ghi file JSON
  fs.writeFileSync(backendConfPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved to backend & frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
