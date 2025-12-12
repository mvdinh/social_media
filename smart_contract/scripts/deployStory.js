import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module: tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // ĐỔI CONTRACT NAME TẠI ĐÂY (Story)
  const Story = await hre.ethers.getContractFactory("Story");
  const story = await Story.deploy();
  await story.waitForDeployment(); // ethers 6.x

  console.log("✅ Story deployed to:", story.target);

  // =========================
  // Lưu ABI + Address cho backend + frontend
  // =========================
  const frontendConfPath = path.join(__dirname, "../../client/src/contracts/story.json");

  // ethers 6.x: abi trả về string hoặc array → parse lại cho chắc
  const abiString = story.interface.format("json");
  const abi = typeof abiString === "string" ? JSON.parse(abiString) : abiString;

  const data = {
    address: story.target,
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
