// ===============================================
// routes/auth.js - Authentication Routes
// ===============================================
import express from "express";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { User, RefreshToken } from "../models/index.js";

dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// ===============================================
// Helper: Tạo username từ address
// ===============================================
const generateUsername = (address) => {
  const shortAddress = address.substring(2, 8);
  const randomNames = ['Crypto', 'Web3', 'Defi', 'NFT', 'Blockchain', 'Degen', 'Whale', 'Moon'];
  const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
  return `${randomName}User${shortAddress}`;
};

// ===============================================
// Helper: Tạo JWT tokens
// ===============================================
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
      address: user.address,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id.toString(),
      address: user.address,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// ===============================================
// Helper: Lưu refresh token vào DB
// ===============================================
const saveRefreshToken = async (token, userId, address, deviceInfo) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  await RefreshToken.create({
    token,
    userId,
    address: address.toLowerCase(),
    expiresAt,
    deviceInfo
  });
};

// ===============================================
// 1. POST /api/auth/nonce - Lấy nonce để ký
// ===============================================
router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;

    // Validate address
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid wallet address' 
      });
    }

    const lowerAddress = address.toLowerCase();

    // Tìm hoặc tạo user
    let user = await User.findOne({ address: lowerAddress });
    
    if (!user) {
      // Tạo user mới với username tạm
      const username = generateUsername(address);
      user = new User({
        address: lowerAddress,
        username,
        name: username
      });
    }

    // Generate nonce
    const nonce = user.generateNonce();
    await user.save();

    // Tạo message để ký
    const timestamp = new Date().toISOString();
    const message = `Sign this message to authenticate with Web3 Social:\n\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

    res.json({
      success: true,
      message,
      nonce,
      timestamp
    });

  } catch (error) {
    console.error('❌ Nonce generation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate nonce' 
    });
  }
});

// ===============================================
// 2. POST /api/auth/verify - Verify signature và đăng nhập
// ===============================================
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, timestamp } = req.body;

    // Validate input
    if (!address || !signature) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing address or signature' 
      });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid wallet address' 
      });
    }

    const lowerAddress = address.toLowerCase();

    // Tìm user và nonce
    const user = await User.findOne({ address: lowerAddress });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: 'User not found. Please request a new nonce.' 
      });
    }

    // Verify nonce chưa hết hạn
    if (!user.verifyNonce()) {
      user.clearNonce();
      await user.save();
      return res.status(400).json({ 
        success: false,
        error: 'Nonce expired. Please request a new nonce.' 
      });
    }

    // Reconstruct message
    const message = `Sign this message to authenticate with Web3 Social:\n\nNonce: ${user.nonce}\nTimestamp: ${timestamp || new Date().toISOString()}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

    // Verify signature
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid signature format' 
      });
    }

    if (recoveredAddress.toLowerCase() !== lowerAddress) {
      return res.status(401).json({ 
        success: false,
        error: 'Signature verification failed' 
      });
    }

    // Xóa nonce đã sử dụng
    user.clearNonce();
    user.updateLastLogin();
    await user.save();

    // Tạo JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Lưu refresh token
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || '',
      ip: req.ip || req.connection.remoteAddress || ''
    };
    await saveRefreshToken(refreshToken, user._id, user.address, deviceInfo);

    console.log('✅ User authenticated:', user.username);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
        city: user.city,
        website: user.website,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during verification' 
    });
  }
});

// ===============================================
// 3. POST /api/auth/refresh - Refresh access token
// ===============================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired refresh token' 
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token type' 
      });
    }

    // Check if token exists in DB and not revoked
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken,
      userId: decoded.userId,
      isRevoked: false
    });

    if (!tokenDoc || !tokenDoc.isValid()) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token is invalid or revoked' 
      });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        address: user.address,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRY }
    );

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        address: user.address,
        username: user.username,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to refresh token' 
    });
  }
});

// ===============================================
// 4. POST /api/auth/logout - Logout user
// ===============================================
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Refresh token is required' 
      });
    }

    // Revoke refresh token
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    
    if (tokenDoc) {
      tokenDoc.revoke();
      await tokenDoc.save();
      console.log('✅ User logged out, token revoked');
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to logout' 
    });
  }
});

// ===============================================
// 5. POST /api/auth/logout-all - Logout from all devices
// ===============================================
router.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { userId: decoded.userId, isRevoked: false },
      { $set: { isRevoked: true } }
    );

    console.log('✅ All sessions revoked for user:', decoded.username);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });

  } catch (error) {
    console.error('❌ Logout-all error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to logout from all devices' 
    });
  }
});

// ===============================================
// 6. GET /api/auth/me - Get current user info
// ===============================================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-nonce -nonceExpiry');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired' 
      });
    }
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user info' 
    });
  }
});

export default router;