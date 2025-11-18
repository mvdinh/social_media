import express from "express";
import Relationship from "../models/relationship.model.js";
import User from "../models/user.model.js"
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
  if (!currentAddress) return res.status(400).json({ success: false, message: "Missing currentAddress" });

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
    const requests = await User.find({ receiver: address, status: "PENDING" });
    const pending = await Promise.all(
      requests.map(async (r) => {
        const chainStatus = await getChainStatus(r.sender, r.receiver);
        return { from: r.sender, to: r.receiver, status: chainStatus };
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
        return { friend: friendAddr, status: chainStatus };
      })
    );

    res.json({ success: true, friends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==== FRIEND ACTIONS: send / cancel / accept / reject ====
router.post("/action", async (req, res) => {
  const { action, sender, receiver } = req.body;
  if (!action || !sender || !receiver) return res.status(400).json({ success: false, message: "Missing params" });

  try {
    let fr = await Relationship.findOne({ sender, receiver });

    switch (action) {
      case "send":
        if (!fr) fr = new Relationship({ sender, receiver, status: "PENDING" });
        else fr.status = "PENDING";
        await fr.save();
        await (await contract.sendRelationship(receiver)).wait();
        break;

      case "cancel":
        if (fr) {
          fr.status = "NONE";
          await fr.save();
        }
        await (await contract.cancelRelationship(receiver)).wait();
        break;

      case "accept":
        if (!fr) {
          const reverse = await Relationship.findOne({ sender: receiver, receiver: sender });
          if (reverse) {
            reverse.status = "ACCEPTED";
            await reverse.save();
          }
        } else {
          fr.status = "ACCEPTED";
          await fr.save();
        }
        await (await contract.acceptRelationship(receiver)).wait();
        break;

      case "reject":
        if (!fr) {
          const reverse = await Relationship.findOne({ sender: receiver, receiver: sender });
          if (reverse) {
            reverse.status = "NONE";
            await reverse.save();
          }
        } else {
          fr.status = "NONE";
          await fr.save();
        }
        await (await contract.rejectRelationship(receiver)).wait();
        break;

      default:
        return res.status(400).json({ success: false, message: "Unknown action" });
    }

    // Return combined DB + blockchain status
    const finalStatus = await getChainStatus(sender, receiver);
    res.json({ success: true, status: finalStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Action failed" });
  }
});

export default router;
