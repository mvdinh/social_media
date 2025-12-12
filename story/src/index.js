import express from "express";
import cors from "cors"; 
import storyRoutes from "./routers/Story.js";

const app = express();

// --- Cấu hình Middleware ---

// 3. Sử dụng CORS: Cho phép client (React) ở port khác gọi đến server (Express)
app.use(cors());

// Cho phép server đọc dữ liệu JSON
app.use(express.json());

// --- Định tuyến (Routing) ---

// Khi client gọi '.../stories', nó sẽ được chuyển đến 'storyRoutes'
app.use("/", storyRoutes);

// --- Khởi động Server ---
const port = 5000;
app.listen(port, () => {
  console.log(`Backend 'story' đang chạy tại http://localhost:${port}`);
});