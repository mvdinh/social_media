// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import './models/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import syncRoutes from './routes/sync.js';
import queryRoutes from './routes/query.js';
import ipfsRoutes from './routes/ipfs.js';
import postRoutes from './routes/post.js';
import deletedbRoutes from './routes/deletedb.js';
import getPostRoutes from './routes/getPost.js';
import ipfsProxyRoutes from './routes/ipfsProxy.js';
import messagesRoutes from './routes/message.js';
import usersRoutes from './routes/user.js';

// Import WebSocket signaling server
import { initSignalingServer } from './services/signalingServer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ===============================================
// Middleware
// ===============================================
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-address', 'X-Requested-With'],
  exposedHeaders: ["x-request-id"]
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ===============================================
// MongoDB Connection
// ===============================================
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===============================================
// Routes
// ===============================================
app.use('/api/auth', authRoutes);       // Nonce & Verify
app.use('/api/sync', syncRoutes);       // Sync blockchain -> DB
app.use('/api/query', queryRoutes);     // Query cached data
app.use('/api/ipfs', ipfsRoutes);       // IPFS operations
app.use('/api/post', postRoutes);       // Post CRUD
app.use('/api/', getPostRoutes);        // Get posts
app.use('/api/admin', deletedbRoutes);  // Clear DB (dev only)
app.use('/api/ipfsProxy', ipfsProxyRoutes);
app.use('/api/messages', messagesRoutes); // Messaging REST
app.use('/api/users', usersRoutes);       // Update messaging public key

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===============================================
// Start Server
// ===============================================
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN}`);
  console.log(`⛓️  Contract: ${process.env.CONTRACT_ADDRESS}`);
});

// ===============================================
// WebSocket Signaling Server
// ===============================================
initSignalingServer(httpServer);
