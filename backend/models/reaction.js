import mongoose from "mongoose";

const ReactionSchema = new mongoose.Schema(
  {
    storyHash: { type: String, required: true, index: true },

    reactorAddress: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^0x[a-fA-F0-9]{40}$/, // validate ví ETH
    },

    reactionType: {
      type: String,
      required: true,
    },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ⚡ Chặn 1 người 1 story chỉ thả 1 reactionType
ReactionSchema.index(
  { storyHash: 1, reactorAddress: 1, reactionType: 1 },
  { unique: true }
);

export default mongoose.model("Reaction", ReactionSchema);
