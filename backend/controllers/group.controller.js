import Group from "../models/group.model.js";
import GroupJoinRequest from "../models/groupJoinRequest.model.js";
import { getReadContract } from "../config/groupContract.js";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../services/ipfs.service.js";
import { ethers } from "ethers";
import fs from "fs";

const contract = getReadContract();
// ================= CREATE GROUP =================
export const createGroup = async (req, res) => {
  try {
    const { groupId, name, description, privacy } = req.body;
    const owner = req.user.address; // từ JWT

    
    if (!groupId || !name) {
      return res.status(400).json({ message: "groupId & name are required" });
    }

    // ================== VERIFY OWNER ON-CHAIN ==================
    const isOwner = await contract.checkOwnership(groupId, owner);
    if (!isOwner) {
      return res.status(403).json({ message: "Not group owner" });
    }

    // ================== CHECK DB ==================
    const existed = await Group.findOne({ groupId });
    if (existed) {
      return res.status(409).json({ message: "Group already synced" });
    }

    // ================== UPLOAD FILES ==================
    let avatarCid = null;
    let coverCid = null;

    if (req.files?.avatar?.[0]) {
      avatarCid = await uploadFileToIPFS(req.files.avatar[0].path);
      fs.unlinkSync(req.files.avatar[0].path);
    }

    if (req.files?.coverImage?.[0]) {
      coverCid = await uploadFileToIPFS(req.files.coverImage[0].path);
      fs.unlinkSync(req.files.coverImage[0].path);
    }

    // ================== UPLOAD METADATA JSON ==================
    const metadata = {
      name,
      description,
      privacy,
      avatar: avatarCid
        ? `${process.env.IPFS_GATEWAY}/${avatarCid}`
        : null,
      coverImage: coverCid
        ? `${process.env.IPFS_GATEWAY}/${coverCid}`
        : null,
      owner,
      createdAt: new Date().toISOString()
    };

    const metadataCid = await uploadJSONToIPFS(metadata);

    // ================== SAVE DB ==================
    const group = await Group.create({
      groupId,
      owner,
      name,
      description,
      avatar: avatarCid,
      coverImage: coverCid,
      metadataCid,
      privacy,
      memberCount: 1
    });

    res.status(201).json({
      success: true,
      group: {
        ...group.toObject(),
        avatar: avatarCid
          ? `${process.env.IPFS_GATEWAY}/${avatarCid}`
          : null,
        coverImage: coverCid
          ? `${process.env.IPFS_GATEWAY}/${coverCid}`
          : null,
        metadataUrl: `${process.env.IPFS_GATEWAY}/${metadataCid}`
      }
    });

  } catch (err) {
    console.error("Create group error:", err);
    res.status(500).json({ message: err.message });
  }
};
// ================= GET GROUP =================
export const getMyGroups = async (req, res) => {
  try {
    const userAddress = req.user.address;

    const groups = await Group.find({
      $or: [
        { owner: userAddress },
        { members: userAddress }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, groups });
  } catch (err) {
    console.error("Get my groups error:", err);
    res.status(500).json({ message: err.message });
  }
};  


// Lấy danh sách nhóm mà user đã gửi join request
export const getMyJoinRequests = async (req, res) => {
  try {
    const userAddress = req.user.address;

    // 1️⃣ Lấy tất cả join request của user
    const requests = await GroupJoinRequest.find({ userAddress });

    // 2️⃣ Lấy thông tin group tương ứng
    const groupIds = requests.map(r => r.groupId);

    const groups = await Group.find({ groupId: { $in: groupIds } });

    res.json({
      success: true,
      groups
    });
  } catch (err) {
    console.error("Get my join requests error:", err);
    res.status(500).json({ message: err.message });
  }
};



