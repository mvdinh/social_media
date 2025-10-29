async function main() {
  console.log("🚀 Deploying PostSocial...\n");
  
  const PostSocial = await ethers.getContractFactory("PostSocial");
  const postSocial = await PostSocial.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await postSocial.waitForDeployment();
  
  const address = await postSocial.getAddress();
  
  console.log("\n✅ SUCCESS!");
  console.log("═══════════════════════════════════════════");
  console.log("Contract Address:", address);
  console.log("═══════════════════════════════════════════");
  console.log("\n📝 Copy address này vào CONTRACT_ADDRESS trong App.tsx\n");
}

main().catch((error) => {
  console.error("❌ ERROR:", error.message);
  process.exit(1);
});