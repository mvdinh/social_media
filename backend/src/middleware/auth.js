import User from '../models/User.js';
import { ethers } from 'ethers';

// ===============================================
// Authentication Middleware
// ===============================================
export const authMiddleware = async (req, res, next) => {
  try {
    // Get address from header
    const address = req.headers['x-user-address'];

    if (!address) {
      return res.status(401).json({ error: 'No address provided' });
    }

    if (!ethers.isAddress(address)) {
      return res.status(401).json({ error: 'Invalid address format' });
    }

    const normalizedAddress = address.toLowerCase();

    // Find user
    const user = await User.findOne({ address: normalizedAddress });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request
    req.userId = user._id;
    req.userAddress = user.address;
    req.user = user;

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ===============================================
// Optional Authentication (doesn't fail if no auth)
// ===============================================
export const optionalAuth = async (req, res, next) => {
  try {
    const address = req.headers['x-user-address'];

    if (address && ethers.isAddress(address)) {
      const normalizedAddress = address.toLowerCase();
      const user = await User.findOne({ address: normalizedAddress });
      
      if (user) {
        req.userId = user._id;
        req.userAddress = user.address;
        req.user = user;
      }
    }

    next();

  } catch (error) {
    // Don't fail, just continue without auth
    next();
  }
};