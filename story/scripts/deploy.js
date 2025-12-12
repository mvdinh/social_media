import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname trong ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Deploy contract
  const Story = await hre.ethers.getContractFactory("StoryManager");
  const story = await Story.deploy();

  // Chờ contract được deploy (ethers v6)
  await story.waitForDeployment();

  console.log("Story deployed to:", await story.getAddress());

  // Xuất ABI ra file abi.json
  const artifact = await hre.artifacts.readArtifact("StoryManager");
  fs.writeFileSync(
    path.join(__dirname, "../abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  // Lưu address ra file contractAddress.json
  fs.writeFileSync(
    path.join(__dirname, "../contractAddress.json"),
    JSON.stringify({ address: await story.getAddress() }, null, 2)
  );

  console.log("ABI and contract address saved!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
