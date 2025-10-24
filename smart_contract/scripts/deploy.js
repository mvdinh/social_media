async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const IpfsStore = await ethers.getContractFactory("IpfsStore");
  const ipfsStore = await IpfsStore.deploy();
  await ipfsStore.deployed();

  console.log("IpfsStore deployed to:", ipfsStore.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
