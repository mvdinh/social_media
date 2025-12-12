import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Import Routes
import authRoutes from "./routes/auth.route.js";
import storyRoutes from "./routes/story.route.js"; 

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Kết nối DB
connectDB();

// === ĐĂNG KÝ ROUTES ===
app.use("/api/auth", authRoutes);   // <-- API Đăng nhập
app.use("/api/story", storyRoutes); // <-- API Story (cũ)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));