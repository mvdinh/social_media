import express from "express";
import Relationship from "../models/relationship.model.js";
import User from "../models/user.model.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Load contract
const friendSystem = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/friendSystem.json"))
);
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(friendSystem.address, friendSystem.abi, provider);

// Map numeric status -> string
const STATUS_MAP = ["NONE", "PENDING", "ACCEPTED"];

// ==== HELPER: check blockchain status 2 chiều ====
async function getChainStatus(sender, receiver) {
  try {
    const [s, r] = await Promise.all([
      contract.getFriendshipStatus(sender, receiver),
      contract.getFriendshipStatus(receiver, sender),
    ]);
    const statusS = STATUS_MAP[Number(s)];
    const statusR = STATUS_MAP[Number(r)];

    // Map to UI-friendly status
    if (statusS === "ACCEPTED" || statusR === "ACCEPTED") return "ACCEPTED";
    if (statusS === "PENDING") return "SENT_PENDING";
    if (statusR === "PENDING") return "RECEIVED_PENDING";
    return "NONE";
  } catch (err) {
    console.error("getChainStatus error:", err);
    return "NONE";
  }
}

// ==== GET ALL FRIENDS / LIST ====
router.get("/list", async (req, res) => {
  const { currentAddress } = req.query;
  if (!currentAddress) {
    return res.status(400).json({ success: false, message: "Missing currentAddress" });
  }

  try {
    const requests = await Relationship.find({
      $or: [{ sender: currentAddress }, { receiver: currentAddress }],
    });

    const users = await Promise.all(
      requests.map(async (r) => {
        const friendAddress = r.sender === currentAddress ? r.receiver : r.sender;
        const chainStatus = await getChainStatus(currentAddress, friendAddress);
        return {
          address: friendAddress,
          sender: r.sender,
          receiver: r.receiver,
          status: chainStatus,
        };
      })
    );

    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== GET PENDING RECEIVED ====
router.get("/:address/pending", async (req, res) => {
  const { address } = req.params;

  try {
    const requests = await Relationship.find({ 
      receiver: address, 
      status: "PENDING" 
    });
    
    const pending = await Promise.all(
      requests.map(async (r) => {
        const chainStatus = await getChainStatus(r.sender, r.receiver);
        return { 
          from: r.sender, 
          to: r.receiver, 
          status: chainStatus,
          createdAt: r.createdAt 
        };
      })
    );
    
    res.json({ success: true, pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== GET FRIENDS ====
router.get("/:address/friends", async (req, res) => {
  const { address } = req.params;

  try {
    const requests = await Relationship.find({
      $or: [{ sender: address }, { receiver: address }],
      status: "ACCEPTED",
    });

    const friends = await Promise.all(
      requests.map(async (r) => {
        const friendAddr = r.sender === address ? r.receiver : r.sender;
        const chainStatus = await getChainStatus(address, friendAddr);
        return { 
          friend: friendAddr, 
          status: chainStatus,
          acceptedAt: r.updatedAt
        };
      })
    );

    res.json({ success: true, friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== GỬI LỜI MỜI KẾT BẠN ====
router.post("/send-request", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing sender or receiver address" 
    });
  }

  if (sender === receiver) {
    return res.status(400).json({ 
      success: false, 
      message: "Cannot send friend request to yourself" 
    });
  }

  try {
    // Kiểm tra xem đã có quan hệ nào chưa
    const existingRelation = await Relationship.findOne({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender }
      ]
    });

    if (existingRelation) {
      if (existingRelation.status === "ACCEPTED") {
        return res.status(400).json({ 
          success: false, 
          message: "Already friends" 
        });
      }
      if (existingRelation.status === "PENDING") {
        return res.status(400).json({ 
          success: false, 
          message: "Friend request already sent" 
        });
      }
    }

    // Kiểm tra user receiver có tồn tại không
    const receiverUser = await User.findOne({ address: receiver });
    if (!receiverUser) {
      return res.status(404).json({ 
        success: false, 
        message: "Receiver user not found" 
      });
    }

    // Tạo quan hệ mới
    const newRelation = new Relationship({
      sender,
      receiver,
      status: "PENDING"
    });

    await newRelation.save();

    res.json({ 
      success: true, 
      message: "Friend request sent successfully",
      relationship: newRelation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== HỦY LỜI MỜI KẾT BẠN ====
router.delete("/cancel-request", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing sender or receiver address" 
    });
  }

  try {
    // Tìm và xóa quan hệ PENDING do sender gửi
    const relation = await Relationship.findOneAndDelete({
      sender,
      receiver,
      status: "PENDING"
    });

    if (!relation) {
      return res.status(404).json({ 
        success: false, 
        message: "Friend request not found or already processed" 
      });
    }

    res.json({ 
      success: true, 
      message: "Friend request cancelled successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== CHẤP NHẬN LỜI MỜI KẾT BẠN ====
router.post("/accept-request", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing sender or receiver address" 
    });
  }

  try {
    // Tìm quan hệ PENDING
    const relation = await Relationship.findOne({
      sender,
      receiver,
      status: "PENDING"
    });

    if (!relation) {
      return res.status(404).json({ 
        success: false, 
        message: "Friend request not found" 
      });
    }

    // Cập nhật status thành ACCEPTED
    relation.status = "ACCEPTED";
    await relation.save();

    res.json({ 
      success: true, 
      message: "Friend request accepted successfully",
      relationship: relation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== TỪ CHỐI LỜI MỜI KẾT BẠN ====
router.delete("/reject-request", async (req, res) => {
  const { sender, receiver } = req.body;

  if (!sender || !receiver) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing sender or receiver address" 
    });
  }

  try {
    // Xóa quan hệ PENDING
    const relation = await Relationship.findOneAndDelete({
      sender,
      receiver,
      status: "PENDING"
    });

    if (!relation) {
      return res.status(404).json({ 
        success: false, 
        message: "Friend request not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Friend request rejected successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== HỦY KẾT BẠN (UNFRIEND) ====
router.delete("/unfriend", async (req, res) => {
  const { address1, address2 } = req.body;

  if (!address1 || !address2) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing addresses" 
    });
  }

  try {
    // Tìm và xóa quan hệ ACCEPTED
    const relation = await Relationship.findOneAndDelete({
      $or: [
        { sender: address1, receiver: address2, status: "ACCEPTED" },
        { sender: address2, receiver: address1, status: "ACCEPTED" }
      ]
    });

    if (!relation) {
      return res.status(404).json({ 
        success: false, 
        message: "Friendship not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Unfriended successfully" 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;