import { ethers } from "ethers";
import Nonce from "../models/nonce.js";
import Reaction from "../models/reaction.js";
import { EIP712_DOMAIN, EIP712_TYPES } from "../config/eip712.js";

// POST /nonce
export const generateNonce = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) return res.status(400).json({ error: "Invalid Address" });

    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Nonce.findOneAndUpdate(
      { address: address.toLowerCase() },
      { nonce, expiresAt, used: false },
      { upsert: true, new: true }
    );

    res.json({ success: true, nonce });
  } catch (error) {
    res.status(500).json({ error: "Nonce generation failed" });
  }
};

// POST /react
export const createReaction = async (req, res) => {
  try {
    const { storyHash, reactorAddress, reactionType, timestamp, nonce, signature, chainId } = req.body;

    // 1. Basic Validation
    if (!storyHash || !reactorAddress || !signature) return res.status(400).json({ error: "Missing fields" });
    
    // 2. Validate Timestamp
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 300) return res.status(400).json({ error: "Expired request" });

    // 3. Verify Nonce
    const nonceDoc = await Nonce.findOne({ 
      address: reactorAddress.toLowerCase(), 
      nonce, 
      used: false 
    });
    
    if (!nonceDoc || nonceDoc.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid/Expired Nonce" });
    }

    // 4. Verify EIP-712 Signature
    
    
    const domain = { ...EIP712_DOMAIN, chainId: chainId || EIP712_DOMAIN.chainId };
    const value = { storyHash, reactionType, timestamp, nonce };
    
    const recovered = ethers.verifyTypedData(domain, EIP712_TYPES, value, signature);
    
    if (recovered.toLowerCase() !== reactorAddress.toLowerCase()) {
      return res.status(401).json({ error: "Invalid Signature" });
    }

    // 5. Prevent Duplicates & Save
    const existing = await Reaction.findOne({ storyHash, reactorAddress: reactorAddress.toLowerCase(), reactionType });
    if (existing) return res.status(400).json({ error: "Already reacted" });

    await Nonce.updateOne({ _id: nonceDoc._id }, { used: true }); // Invalidate nonce

    await Reaction.create({
      storyHash,
      reactorAddress: reactorAddress.toLowerCase(),
      reactionType,
      timestamp: new Date(timestamp * 1000),
      signature,
      chainId
    });

    const count = await Reaction.countDocuments({ storyHash, reactionType });
    res.json({ success: true, currentCount: count });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /reactions/:storyHash
export const getReactions = async (req, res) => {
  try {
    const counts = await Reaction.aggregate([
      { $match: { storyHash: req.params.storyHash } },
      { $group: { _id: "$reactionType", count: { $sum: 1 } } }
    ]);
    
    const result = counts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch counts" });
  }
};