const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SocialMedia contract...");

  // Deploy contract
  const SocialMedia = await hre.ethers.getContractFactory("SocialMedia");
  const socialMedia = await SocialMedia.deploy();

  await socialMedia.waitForDeployment();
  const address = await socialMedia.getAddress();

  console.log(`✅ SocialMedia deployed successfully!`);
  console.log(`📜 Contract address: ${address}`);

  // 📂 Đường dẫn tuyệt đối đến backend/src/config và client/src/config
  const configDirBackend = path.join(__dirname, "..", "..", "backend", "src", "config");
  const configDirClient = path.join(__dirname, "..", "..", "client", "src", "config");

  // 🔧 Tạo thư mục nếu chưa tồn tại
  [configDirBackend, configDirClient].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created config directory: ${dir}`);
    }
  });

  // 💾 Lưu contract address
  const addressData = JSON.stringify({ SocialMedia: address }, null, 2);
  fs.writeFileSync(path.join(configDirBackend, "contract-address.json"), addressData);
  fs.writeFileSync(path.join(configDirClient, "contract-address.json"), addressData);
  console.log(`💾 Saved contract address to both backend & client`);

  // 💾 Lưu ABI
  const artifact = await hre.artifacts.readArtifact("SocialMedia");
  const abiData = JSON.stringify(artifact, null, 2);
  fs.writeFileSync(path.join(configDirBackend, "SocialMedia.json"), abiData);
  fs.writeFileSync(path.join(configDirClient, "SocialMedia.json"), abiData);
  console.log(`💾 Saved ABI to both backend & client`);

  console.log("🎉 Deployment complete!");
  console.log("\n📋 Summary:");
  console.log(`   Contract: SocialMedia`);
  console.log(`   Address: ${address}`);
  console.log(`   Network: ${hre.network.name}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
