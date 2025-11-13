import express from "express";
import User from "../models/user.model.js";
import Relationship from "../models/relationship.model.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Load contract
const friendSystem = JSON.parse(fs.readFileSync(path.join(__dirname, "../config/friendSystem.json")));
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(friendSystem.address, friendSystem.abi, provider);

// Hàm lấy status bạn bè trên blockchain
async function getFriendshipStatus(user1, user2) {
  try {
    const status = await contract.getFriendshipStatus(user1, user2);
    const map = ["NONE", "PENDING", "ACCEPTED"];
    return map[Number(status)] || "UNKNOWN";
  } catch (err) {
    console.error("getFriendshipStatus error:", err);
    return "ERROR";
  }
}

// ===== API /list tối ưu với verify blockchain =====
router.get("/list", async (req, res) => {
  try {
    const { currentAddress } = req.query;
    if (!currentAddress) return res.status(400).json({ success: false, message: "Missing currentAddress" });

    // 1️⃣ Lấy danh sách user từ DB
    const users = await User.find({ address: { $ne: currentAddress } });

    // 2️⃣ Lấy relationships hiện tại từ DB
    const relationships = await Relationship.find({
      $or: [{ user1: currentAddress }, { user2: currentAddress }],
    });

    // 3️⃣ Chuẩn bị kết quả, dùng DB làm mặc định
    const results = await Promise.all(users.map(async (u) => {
      // Tìm trong DB
      let rel = relationships.find(r =>
        (r.user1 === currentAddress && r.user2 === u.address) ||
        (r.user2 === currentAddress && r.user1 === u.address)
      );

      let dbStatus = rel ? rel.status : "NONE";

      // 4️⃣ Verify với blockchain
      const chainStatus = await getFriendshipStatus(currentAddress, u.address);

      // 5️⃣ Nếu khác DB → update DB
      if (chainStatus !== dbStatus && chainStatus !== "ERROR") {
        if (rel) {
          rel.status = chainStatus;
          await rel.save();
        } else if (chainStatus !== "NONE") {
          await Relationship.create({
            user1: currentAddress,
            user2: u.address,
            status: chainStatus
          });
        }
        dbStatus = chainStatus;
      }

      return {
        address: u.address,
        name: u.name || "Unknown",
        status: dbStatus
      };
    }));

    res.json({ success: true, users: results });

  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===== API 1: Lấy danh sách lời mời pending =====
router.get("/:address/pending", async (req, res) => {
  const { address } = req.params;
  try {
    // Lấy lời mời từ DB
    const pending = await Relationship.find({
      $or: [{ user1: address, status: "PENDING" }, { user2: address, status: "PENDING" }]
    });

    // Optionally: verify blockchain
    const results = await Promise.all(pending.map(async r => {
      const chainStatus = await getFriendshipStatus(r.user1, r.user2);
      if (chainStatus !== r.status && chainStatus !== "ERROR") {
        r.status = chainStatus;
        await r.save();
      }
      return {
        user1: r.user1,
        user2: r.user2,
        status: r.status
      };
    }));

    res.json({ success: true, pending: results });
  } catch (err) {
    console.error("Get pending error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===== API 2: Lấy danh sách bạn bè =====
router.get("/:address/friends", async (req, res) => {
  const { address } = req.params;
  try {
    const friends = await Relationship.find({
      $or: [
        { user1: address, status: "ACCEPTED" },
        { user2: address, status: "ACCEPTED" }
      ]
    });

    // Verify blockchain nếu muốn
    const results = await Promise.all(friends.map(async r => {
      const chainStatus = await getFriendshipStatus(r.user1, r.user2);
      if (chainStatus !== r.status && chainStatus !== "ERROR") {
        r.status = chainStatus;
        await r.save();
      }
      return {
        friend: r.user1 === address ? r.user2 : r.user1,
        status: r.status
      };
    }));

    res.json({ success: true, friends: results });
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
