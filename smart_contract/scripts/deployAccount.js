import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // ĐỔI CONTRACT NAME TẠI ĐÂY
  const Account = await hre.ethers.getContractFactory("Account");
  const account = await Account.deploy();
  await account.waitForDeployment(); // ethers 6.x

  console.log("✅ Account deployed to:", account.target);

  // =========================
  // Lưu ABI + Address cho backend + frontend
  // =========================
  const backendConfPath = path.join(__dirname, "../../backend/src/bloc/acc.json");
  const frontendConfPath = path.join(__dirname, "../../client/src/bloc/acc.json");

  
  // ethers 6.x: abi có thể trả về string hoặc array, parse cho chắc
  const abiString = account.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: account.target,
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
