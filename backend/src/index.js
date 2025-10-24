// ===============================================
// server.js or index.js - Main Server File
// ===============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';

// Import database config
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// ===============================================
// Initialize Express App
// ===============================================
const app = express();

// ===============================================
// Middleware
// ===============================================
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===============================================
// Connect to MongoDB
// ===============================================
connectDB();

// ===============================================
// API Routes
// ===============================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// ===============================================
// Health Check Endpoint
// ===============================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ===============================================
// Root Endpoint
// ===============================================
app.get('/', (req, res) => {
  res.json({
    message: 'Web3 Social Network API',
    version: '1.0.0',
    endpoints: {
      auth: {
        nonce: 'POST /api/auth/nonce',
        verify: 'POST /api/auth/verify',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        logoutAll: 'POST /api/auth/logout-all',
        me: 'GET /api/auth/me'
      },
      user: {
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile',
        getUser: 'GET /api/user/:username',
        getUsers: 'GET /api/users',
        followers: 'GET /api/user/:userId/followers',
        following: 'GET /api/user/:userId/following',
        follow: 'POST /api/user/:userId/follow',
        unfollow: 'DELETE /api/user/:userId/unfollow',
        suggestions: 'GET /api/user/search/suggestions'
      },
      posts: {
        create: 'POST /api/posts',
        getFeed: 'GET /api/posts/feed',
        getPost: 'GET /api/posts/:postId',
        getUserPosts: 'GET /api/posts/user/:userId',
        update: 'PUT /api/posts/:postId',
        delete: 'DELETE /api/posts/:postId',
        like: 'POST /api/posts/:postId/like',
        unlike: 'DELETE /api/posts/:postId/unlike',
        comment: 'POST /api/posts/:postId/comment',
        getComments: 'GET /api/posts/:postId/comments',
        deleteComment: 'DELETE /api/posts/:postId/comments/:commentId'
      },
      health: 'GET /api/health'
    }
  });
});

// ===============================================
// 404 Handler
// ===============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// ===============================================
// Global Error Handler
// ===============================================
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===============================================
// Start Server
// ===============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Web3 Social Network API Server');
  console.log('='.repeat(50));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}`);
  
});

// ===============================================
// Graceful Shutdown
// ===============================================
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  await mongoose.connection.close();
  console.log('👋 Server shut down gracefully');
  process.exit(0);
});

export default app;