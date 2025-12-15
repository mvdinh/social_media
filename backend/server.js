import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";

// Routes Imports
import authRoutes from "./routes/auth.route.js";
import storyRoutes from "./routes/story.route.js"; 
import postRoutes from "./routes/post.routes.js";
import ipfsRoutes from "./routes/ipfs.route.js";
import relationshipRoutes from "./routes/relationship.route.js";
import groupRoutes from "./routes/group.routes.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import notificationRoutes from "./routes/notification.route.js";

// Services Imports
import { initSignalingServer } from "./services/signalingServer.js"; // Chat (ws)

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middlewares cơ bản
app.use(cors());
app.use(express.json());

// Database
connectDB();

initSignalingServer(server);


// ============================================================
// 🔥 3. ROUTES (Phải đặt SAU middleware req.io)
// ============================================================
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/auth", authRoutes);   
app.use("/api/story", storyRoutes); 
app.use("/api/posts", postRoutes); // postController nằm trong đây sẽ dùng được req.io
app.use("/api/relationships", relationshipRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});