const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SocialPosts", function () {
  let socialPosts;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const SocialPosts = await ethers.getContractFactory("SocialPosts");
    socialPosts = await SocialPosts.deploy();
    await socialPosts.waitForDeployment();
  });

  describe("Create Post", function () {
    it("Should create a post and emit event", async function () {
      const cid = "QmTest123";
      await expect(socialPosts.createPost(cid))
        .to.emit(socialPosts, "PostCreated")
        .withArgs(1, owner.address, cid, await time.latest() + 1);

      const post = await socialPosts.getPost(1);
      expect(post.author).to.equal(owner.address);
      expect(post.contentCID).to.equal(cid);
    });
  });

  describe("Like Post", function () {
    beforeEach(async function () {
      await socialPosts.createPost("QmTest123");
    });

    it("Should like a post", async function () {
      await expect(socialPosts.connect(user1).likePost(1))
        .to.emit(socialPosts, "PostLiked")
        .withArgs(1, user1.address, true);

      const post = await socialPosts.getPost(1);
      expect(post.likeCount).to.equal(1);
      expect(await socialPosts.hasLiked(1, user1.address)).to.be.true;
    });

    it("Should not allow double like", async function () {
      await socialPosts.connect(user1).likePost(1);
      await expect(socialPosts.connect(user1).likePost(1))
        .to.be.revertedWith("Already liked");
    });

    it("Should unlike a post", async function () {
      await socialPosts.connect(user1).likePost(1);
      await socialPosts.connect(user1).unlikePost(1);

      const post = await socialPosts.getPost(1);
      expect(post.likeCount).to.equal(0);
      expect(await socialPosts.hasLiked(1, user1.address)).to.be.false;
    });
  });

  describe("Comment Post", function () {
    beforeEach(async function () {
      await socialPosts.createPost("QmTest123");
    });

    it("Should comment on a post", async function () {
      const commentCID = "QmComment123";
      await expect(socialPosts.connect(user1).commentPost(1, commentCID))
        .to.emit(socialPosts, "PostCommented")
        .withArgs(1, user1.address, commentCID, await time.latest() + 1);

      const post = await socialPosts.getPost(1);
      expect(post.commentCount).to.equal(1);
    });
  });

  describe("Share Post", function () {
    beforeEach(async function () {
      await socialPosts.createPost("QmTest123");
    });

    it("Should share a post and create new post", async function () {
      const shareCID = "QmShare123";
      await expect(socialPosts.connect(user1).sharePost(1, shareCID))
        .to.emit(socialPosts, "PostShared")
        .withArgs(1, user1.address, 2, await time.latest() + 1);

      const originalPost = await socialPosts.getPost(1);
      expect(originalPost.shareCount).to.equal(1);

      const sharedPost = await socialPosts.getPost(2);
      expect(sharedPost.author).to.equal(user1.address);
      expect(sharedPost.contentCID).to.equal(shareCID);
    });
  });
});