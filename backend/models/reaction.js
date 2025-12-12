import mongoose from "mongoose";

const ReactionSchema = new mongoose.Schema({
  storyHash: { type: String, required: true, index: true },
  reactorAddress: { type: String, required: true, lowercase: true },
  reactionType: { type: String, required: true }, // 👍, ❤️, ...
  timestamp: { type: Date, default: Date.now },
  signature: { type: String, required: true },
  chainId: { type: Number }
});

// Composite index để 1 người chỉ thả 1 loại reaction cho 1 story
ReactionSchema.index({ storyHash: 1, reactorAddress: 1, reactionType: 1 }, { unique: true });

export default mongoose.model("Reaction", ReactionSchema);