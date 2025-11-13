import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const FriendSystem = await hre.ethers.getContractFactory("FriendSystem");
  const friendSystem = await FriendSystem.deploy();
  await friendSystem.waitForDeployment(); // ethers 6.x

  console.log("✅ FriendSystem deployed to:", friendSystem.target);

  // =========================
  // Lưu ABI + Address cho backend + frontend
  // =========================
  const backendConfPath = path.join(__dirname, "../../backend/src/config/friendSystem.json");
  const frontendConfPath = path.join(__dirname, "../../client/src/config/friendSystem.json");

  // ethers 6.x: abi có thể trả về string hoặc array, parse cho chắc
  const abiString = friendSystem.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: friendSystem.target,
    abi
  };

  fs.mkdirSync(path.dirname(backendConfPath), { recursive: true });
  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });

  fs.writeFileSync(backendConfPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved for backend & frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
