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

  // 📂 Đường dẫn tuyệt đối đến client/src/config
  // Vì client và smart_contract nằm song song, cần "..", ".."
  const configDir = path.join(__dirname, "..", "..", "client", "src", "config");

  // 🔧 Tạo thư mục nếu chưa tồn tại
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 Created config directory: ${configDir}`);
  }

  // 💾 Lưu contract address
  const addressFile = path.join(configDir, "contract-address.json");
  fs.writeFileSync(
    addressFile,
    JSON.stringify({ SocialMedia: address }, null, 2)
  );
  console.log(`💾 Saved contract address to: ${addressFile}`);

  // 💾 Lưu ABI
  const artifact = await hre.artifacts.readArtifact("SocialMedia");
  const abiFile = path.join(configDir, "SocialMedia.json");
  fs.writeFileSync(abiFile, JSON.stringify(artifact, null, 2));
  console.log(`💾 Saved ABI to: ${abiFile}`);

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