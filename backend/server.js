import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/auth.route.js";
import storyRoutes from "./routes/story.route.js"; 
import postRoutes from "./routes/post.routes.js";
import ipfsRoutes from "./routes/ipfs.route.js";
import relationshipRoutes from "./routes/relationship.route.js";

dotenv.config();

// 1️⃣ Khởi tạo express
const app = express();

// 2️⃣ Tạo HTTP server từ express
const server = http.createServer(app);

// 3️⃣ Gắn Socket.IO vào server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 4️⃣ Map lưu user online
const userSocketMap = new Map();

// 5️⃣ Middleware inject io & map
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// 6️⃣ Middlewares
app.use(cors());
app.use(express.json());

// 7️⃣ Socket events
io.on("connection", (socket) => {
  console.log("🟢 New Connection:", socket.id);

  socket.on("register_user", (userAddress) => {
    if (userAddress) {
      userSocketMap.set(userAddress.toLowerCase(), socket.id);
      console.log(`✅ User Registered: ${userAddress} -> ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    for (const [address, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(address);
        break;
      }
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

// 8️⃣ Connect DB
connectDB();

// 9️⃣ Routes
app.use("api/ipfs", ipfsRoutes);
app.use("/api/auth", authRoutes);   
app.use("/api/story", storyRoutes); 
app.use("/api/posts", postRoutes);
app.use("/api/relationships", relationshipRoutes);

// 🔟 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
