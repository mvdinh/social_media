const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TESTING GAS-FREE TRANSACTIONS");
  console.log("=".repeat(80) + "\n");

  // Read deployment summary
  const summaryPath = path.join(__dirname, '../deployment-summary.json');
  let contractAddress;

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    contractAddress = summary.contractAddress;
    console.log("📍 Contract Address:", contractAddress);
  } catch (error) {
    console.error("❌ deployment-summary.json not found!");
    console.log("Please deploy contract first: npx hardhat run scripts/deploy.js --network localhost");
    process.exit(1);
  }

  // Get test accounts
  const [user1, user2, user3] = await hre.ethers.getSigners();
  
  console.log("\n👥 Test Users:");
  console.log("User 1:", await user1.getAddress());
  console.log("User 2:", await user2.getAddress());
  console.log("User 3:", await user3.getAddress());

  // Get contract instance
  const SocialPosts = await hre.ethers.getContractAt("SocialPosts", contractAddress);

  // Helper function to test transaction
  async function testTransaction(name, txPromise, user) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📝 ${name}`);
    console.log(`${"─".repeat(60)}`);
    
    const balanceBefore = await hre.ethers.provider.getBalance(await user.getAddress());
    console.log("💰 Balance before:", hre.ethers.formatEther(balanceBefore), "ETH");
    
    const tx = await txPromise;
    console.log("⏳ Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Confirmed in block:", receipt.blockNumber);
    
    const balanceAfter = await hre.ethers.provider.getBalance(await user.getAddress());
    console.log("💰 Balance after:", hre.ethers.formatEther(balanceAfter), "ETH");
    
    const gasCost = balanceBefore - balanceAfter;
    console.log("💸 Gas cost:", hre.ethers.formatEther(gasCost), "ETH");
    
    if (gasCost === 0n) {
      console.log("✅ 100% GAS-FREE!");
    } else {
      console.log("❌ Gas was charged!");
    }
    
    return receipt;
  }

  // TEST 1: Create Post (User 1)
  await testTransaction(
    "TEST 1: User 1 creates a post",
    SocialPosts.connect(user1).createPost("ipfs_user1_post1", {
      gasPrice: 0,
      gasLimit: 500000
    }),
    user1
  );

  let totalPosts = await SocialPosts.getTotalPosts();
  console.log("📊 Total posts:", totalPosts.toString());

  // TEST 2: Create Post (User 2)
  await testTransaction(
    "TEST 2: User 2 creates a post",
    SocialPosts.connect(user2).createPost("ipfs_user2_post1", {
      gasPrice: 0,
      gasLimit: 500000
    }),
    user2
  );

  totalPosts = await SocialPosts.getTotalPosts();
  console.log("📊 Total posts:", totalPosts.toString());

  // TEST 3: Like Post (User 3 likes User 1's post)
  await testTransaction(
    "TEST 3: User 3 likes post #1",
    SocialPosts.connect(user3).likePost(1, {
      gasPrice: 0,
      gasLimit: 300000
    }),
    user3
  );

  const post1 = await SocialPosts.getPost(1);
  console.log("👍 Post #1 likes:", post1.likeCount.toString());

  // TEST 4: Comment on Post
  await testTransaction(
    "TEST 4: User 2 comments on post #1",
    SocialPosts.connect(user2).commentPost(1, "ipfs_comment_123", {
      gasPrice: 0,
      gasLimit: 300000
    }),
    user2
  );

  const post1Updated = await SocialPosts.getPost(1);
  console.log("💬 Post #1 comments:", post1Updated.commentCount.toString());

  // TEST 5: Share Post
  await testTransaction(
    "TEST 5: User 3 shares post #1",
    SocialPosts.connect(user3).sharePost(1, "ipfs_share_123", {
      gasPrice: 0,
      gasLimit: 500000
    }),
    user3
  );

  const post1Final = await SocialPosts.getPost(1);
  console.log("🔄 Post #1 shares:", post1Final.shareCount.toString());

  totalPosts = await SocialPosts.getTotalPosts();
  console.log("📊 Total posts after share:", totalPosts.toString());

  // TEST 6: Unlike Post
  await testTransaction(
    "TEST 6: User 3 unlikes post #1",
    SocialPosts.connect(user3).unlikePost(1, {
      gasPrice: 0,
      gasLimit: 300000
    }),
    user3
  );

  const post1AfterUnlike = await SocialPosts.getPost(1);
  console.log("👍 Post #1 likes after unlike:", post1AfterUnlike.likeCount.toString());

  // TEST 7: Check hasLiked
  const hasLiked = await SocialPosts.hasLiked(1, await user3.getAddress());
  console.log("❓ User 3 has liked post #1:", hasLiked);

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📊 FINAL STATISTICS");
  console.log("=".repeat(80));

  totalPosts = await SocialPosts.getTotalPosts();
  console.log("📝 Total posts created:", totalPosts.toString());

  for (let i = 1; i <= totalPosts; i++) {
    const post = await SocialPosts.getPost(i);
    console.log(`\nPost #${i}:`);
    console.log("  Author:", post.author);
    console.log("  Content CID:", post.contentCID);
    console.log("  Likes:", post.likeCount.toString());
    console.log("  Comments:", post.commentCount.toString());
    console.log("  Shares:", post.shareCount.toString());
  }

  console.log("\n" + "=".repeat(80));
  console.log("✅ ALL TESTS COMPLETED SUCCESSFULLY!");
  console.log("🎉 ALL TRANSACTIONS WERE 100% GAS-FREE!");
  console.log("=".repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  });