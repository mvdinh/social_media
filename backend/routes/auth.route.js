import express from "express";
import { getNonce, login, requestRefreshToken, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/nonce/:address", getNonce);
router.post("/login", login);

// Route cấp lại token mới
router.post("/refresh", requestRefreshToken);

// Route đăng xuất
router.post("/logout", logout);

export default router;