import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Donate contract...");

  // Compile + get Contract
  const Donate = await hre.ethers.getContractFactory("Donation");
  const donate = await Donate.deploy();
  await donate.waitForDeployment();

  console.log("✅ Donate deployed to:", donate.target);

  // ============================
  // Save ABI + Address cho backend + frontend
  // ============================

  const frontendConfPath = path.join(
    __dirname,
    "../../client/src/contracts/donate.json"
  );

  // ethers 6.x: format abi
  const abiString = donate.interface.format("json");
  const abi =
    typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: donate.target,
    abi,
  };

  // Ensure folders exist
  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });

  // Save JSON files
  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved to backend & frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
