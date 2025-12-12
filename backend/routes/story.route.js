import express from "express";
import { uploadMiddleware } from "../middleware/upload.js";
import { getStories, createStory, viewStory } from "../controllers/storyController.js";
import { generateNonce, createReaction, getReactions } from "../controllers/reactionController.js";

const router = express.Router();

// Story Routes
router.get("/", getStories);
router.post("/post", uploadMiddleware.single("storyFile"), createStory);
router.get("/view/:cid", viewStory);

// Reaction Routes (EIP-712)
router.post("/nonce", generateNonce);
router.post("/react", createReaction);
router.get("/reactions/:storyHash", getReactions);

export default router;