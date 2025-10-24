// ===============================================
// middleware/authMiddleware.js - Authentication Middleware
// ===============================================
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

// ===============================================
// Middleware: Xác thực JWT token
// ===============================================
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({ 
        success: false,
        error: 'Invalid token' 
      });
    }
    req.user = user;
    next();
  });
};

// ===============================================
// Middleware: Xác thực và load user từ DB
// ===============================================
export const authenticateAndLoadUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Load user from database
    const user = await User.findById(decoded.userId).select('-nonce -nonceExpiry');
    
    if (!user || !user.isActive) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found or inactive' 
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({ 
      success: false,
      error: 'Invalid token' 
    });
  }
};

// ===============================================
// Middleware: Optional authentication
// ===============================================
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// ===============================================
// Middleware: Check if user owns resource
// ===============================================
export const checkOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.body[userIdField] || req.params[userIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'Resource user ID not found' 
      });
    }

    if (resourceUserId !== req.user.userId) {
      return res.status(403).json({ 
        success: false,
        error: 'You do not have permission to modify this resource' 
      });
    }

    next();
  };
};