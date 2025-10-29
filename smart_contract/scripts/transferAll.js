const { ethers } = require("hardhat");

async function main() {
  const accounts = await ethers.getSigners();
  const central = accounts[0]; // ví trung tâm
  console.log("Central wallet:", central.address);

  // Lặp qua các ví còn lại và gửi 1 ETH ảo về ví trung tâm
  for (let i = 1; i < accounts.length; i++) {
    const sender = accounts[i];

    // Kiểm tra địa chỉ
    if (!ethers.isAddress(central.address)) {
      throw new Error(`Invalid address: ${central.address}`);
    }

    console.log(`\nVí ${i}: ${sender.address} -> ${central.address}`);

    const tx = await sender.sendTransaction({
      to: central.address,
      value: ethers.parseEther("1.0"), // Gửi 1 ETH ảo
    });

    await tx.wait();
    console.log(`✅ Giao dịch thành công: ${tx.hash}`);
  }

  console.log("\n🎉 Tất cả ETH đã được chuyển về ví trung tâm!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
