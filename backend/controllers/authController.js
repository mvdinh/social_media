import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, address: user.address }, 
    ACCESS_SECRET, 
    { expiresIn: "1h" } 
  );
};

// Helper: Hàm tạo Refresh Token (7 ngày)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, address: user.address }, 
    REFRESH_SECRET, 
    { expiresIn: "7d" } 
  );
};

// 1. GET NONCE (Giữ nguyên)
export const getNonce = async (req, res) => {
  try {
    const { address } = req.params;
    if (!address || !ethers.isAddress(address)) return res.status(400).json({ error: "Invalid Address" });
    const normalizedAddress = address.toLowerCase();
    let user = await User.findOne({ address: normalizedAddress });
    if (!user) user = await User.create({ address: normalizedAddress });
    res.json({ nonce: user.nonce });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. LOGIN (Cập nhật: Trả về cả 2 token)
export const login = async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) return res.status(400).json({ error: "Missing fields" });

    const normalizedAddress = address.toLowerCase();
    const user = await User.findOne({ address: normalizedAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify Signature
    const message = `Nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({ error: "Invalid Signature" });
    }

    // ✅ TẠO 2 TOKEN
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Lưu Refresh Token vào DB để quản lý
    user.refreshToken = refreshToken;
    
    // Đổi Nonce
    user.nonce = Math.floor(Math.random() * 1000000).toString();
    
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken, // Frontend cần lưu cái này
      user: { id: user._id, address: user.address }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login Failed" });
  }
};

// 3. REFRESH TOKEN (API Mới)
// Client gọi API này khi Access Token hết hạn
export const requestRefreshToken = async (req, res) => {
  try {
    // Lấy refresh token từ body
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "You are not authenticated!" });

    // Kiểm tra xem Token này có tồn tại trong DB không (Chống token giả hoặc token đã logout)
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ error: "Refresh token is not valid!" });
    }

    // Verify Token bằng Secret Key
    jwt.verify(refreshToken, REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        console.log("Verify Error:", err);
        return res.status(403).json({ error: "Token is not valid!" });
      }

      // ✅ Cấp phát Token Mới
      // Kỹ thuật "Token Rotation": Khi refresh, ta cấp cả Access mới VÀ Refresh mới
      // Điều này giúp bảo mật hơn: nếu Refresh Token cũ bị lộ, nó sẽ vô hiệu ngay lập tức
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Cập nhật Refresh Token mới vào DB
      user.refreshToken = newRefreshToken;
      await user.save();

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. LOGOUT (API Mới)
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    // Xóa refresh token trong DB -> Token đó sẽ vô hiệu vĩnh viễn
    await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    res.json({ success: true, message: "Logged out successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};