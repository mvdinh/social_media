  import express from "express";
  import { ethers } from "ethers";
  import Friendship from "../models/Friendship.js";
  import FriendRequest from "../models/FriendRequest.js";
  import { readFileSync } from 'fs';
  import { fileURLToPath } from 'url';
  import { dirname, join } from 'path';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const FriendSystemConf = JSON.parse(
    readFileSync(join(__dirname, '../config/friendSystem.json'), 'utf-8')
  );
  const router = express.Router();

  // Provider & Wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // HTTP RPC
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contract = new ethers.Contract(FriendSystemConf.address, FriendSystemConf.abi, wallet);

  // --------------------------
  // 1️⃣ Gửi lời mời kết bạn
  // --------------------------
  router.post("/request", async (req, res) => {
    const { sender, receiver } = req.body;
    if (!sender || !receiver) return res.status(400).json({ error: "Missing sender or receiver" });

    try {
      // 1️⃣ Gọi smart contract
      const tx = await contract.sendFriendRequest(receiver);
      await tx.wait(); // chờ mined

      // 2️⃣ Lưu vào MongoDB
      const request = await FriendRequest.create({ sender, receiver, status: "PENDING" });
      res.json(request);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Blockchain or DB error" });
    }
  });

  // --------------------------
  // 2️⃣ Chấp nhận lời mời
  // --------------------------
  router.post("/accept", async (req, res) => {
    const { sender, receiver } = req.body;
    if (!sender || !receiver) return res.status(400).json({ error: "Missing sender or receiver" });

    try {
      // 1️⃣ Gọi smart contract
      const tx = await contract.acceptFriendRequest(sender);
      await tx.wait();

      // 2️⃣ Lưu vào MongoDB
      await Friendship.create({ user1: sender, user2: receiver, status: "ACCEPTED" });

      // Xóa request cũ
      await FriendRequest.deleteMany({
        $or: [
          { sender, receiver },
          { sender: receiver, receiver: sender },
        ],
      });

      res.json({ message: "Friendship created" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Blockchain or DB error" });
    }
  });

  // --------------------------
  // 3️⃣ Lấy danh sách lời mời
  // --------------------------
  router.get("/requests/:user", async (req, res) => {
    const user = req.params.user;
    const requests = await FriendRequest.find({ receiver: user });
    res.json(requests);
  });

  // --------------------------
  // 4️⃣ Lấy danh sách bạn bè
  // --------------------------
  router.get("/friends/:user", async (req, res) => {
    const user = req.params.user;
    const friends = await Friendship.find({
      $or: [{ user1: user }, { user2: user }],
    });
    res.json(friends);
  });

  export default router;
