import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // ĐỔI CONTRACT NAME TẠI ĐÂY
  const Relationship = await hre.ethers.getContractFactory("Relationship");
  const relationship = await Relationship.deploy();
  await relationship.waitForDeployment(); // ethers 6.x

  console.log("✅ Relationship deployed to:", relationship.target);

  // =========================
  // Lưu ABI + Address cho backend + frontend
  // =========================
  const frontendConfPath = path.join(__dirname, "../../client/src/contracts/relationship.json");

  // ethers 6.x: abi có thể trả về string hoặc array, parse cho chắc
  const abiString = relationship.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: relationship.target,
    abi
  };

  fs.mkdirSync(path.dirname(frontendConfPath), { recursive: true });

  fs.writeFileSync(frontendConfPath, JSON.stringify(data, null, 2));

  console.log("📦 ABI + address saved for backend & frontend");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
