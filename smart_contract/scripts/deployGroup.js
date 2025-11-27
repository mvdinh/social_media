import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Group contract...");

  // Compile + get Contract
  const Group = await hre.ethers.getContractFactory("Groups");
  const group = await Group.deploy();
  await group.waitForDeployment();

  console.log("✅ Group deployed to:", group.target);

  // ============================
  // Save ABI + Address cho backend + frontend
  // ============================

  const frontendConfPath = path.join(
    __dirname,
    "../../client/src/bloc/group.json" // đổi donate.json → group.json
  );

  // ethers 6.x: format ABI
  const abiString = group.interface.format("json");
  const abi =
    typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: group.target,
    abi,
  };

  // Ensure folders exist
  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });

  // Save JSON files
  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
