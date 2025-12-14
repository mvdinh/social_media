// models/Group.js
import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  groupId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },

  owner: {
    type: String, // wallet address
    required: true,
    index: true
  },

  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },      // IPFS CID
  coverImage: { type: String },  // IPFS CID

  metadataCid: { type: String }, // ⭐ JSON IPFS

  privacy: {
    type: String,
    enum: ["PUBLIC", "PRIVATE"],
    default: "PUBLIC"
  },

  memberCount: { type: Number, default: 1 },

  members: {
  type: [String],   // list wallet addresses
  default: []

  },


  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Group", GroupSchema);
