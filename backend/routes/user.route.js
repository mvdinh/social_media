// routes/user.js - P2P Version (No messaging key)
import express from 'express';
import { verifyToken, verifyTokenId} from '../middleware/auth.js';
import User from '../models/user.js';
import { getOnlineAddress } from '../services/signalingServer.js';
import { updateProfile, getUserById } from '../controllers/user.controller.js';
import { uploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Update profile
router.patch('/profile', verifyTokenId, async (req, res) => {
    try {
        const { username, avatar, bio } = req.body || {};
        const updateData = {};

        if (username) updateData.username = username;
        if (avatar) updateData.avatar = avatar;
        if (bio !== undefined) updateData.bio = bio;

        const user = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true }
        );

        res.json({ success: true, user });
    } catch (e) {
        console.error('Update profile error:', e);
        res.status(500).json({ error: 'profile update failed' });
    }
});

// Get my profile
router.get('/me/profile', verifyTokenId, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-nonce -nonceExpiry');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (e) {
        console.error('Fetch profile error:', e);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get all users (with search)
router.get('/', verifyTokenId, async (req, res) => {
    try {
        const { search = '', limit = 50 } = req.query;
        const onlineAddresses = getOnlineAddress().map(a => a.toLowerCase());

        const query = { _id: { $ne: req.userId } };

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('address username avatar bio isOnline lastSeen')
            .limit(Number(limit))
            .sort({ isOnline: -1, lastSeen: -1 })
            .lean();

        const usersWithStatus = users.map(user => ({
            ...user,
            isOnline: onlineAddresses.includes(user.address.toLowerCase())
        }));

        res.json({ success: true, users: usersWithStatus });
    } catch (e) {
        console.error('Get all users error:', e);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get online users
// FIXED VERSION with better error handling
router.get('/online', verifyTokenId, async (req, res) => {
    try {
        const onlineAddresses = getOnlineAddress();
        
        console.log('🔍 Online check - Addresses:', onlineAddresses);
        console.log('🔍 Online check - Count:', onlineAddresses.length);

        if (!onlineAddresses || onlineAddresses.length === 0) {
            return res.json({ 
                success: true,
                online: [],
                debug: {
                    message: 'No online addresses in peers Map',
                    peersMapEmpty: true
                }
            });
        }

        const users = await User.find({
            address: { 
                $in: onlineAddresses.map(a => a.toLowerCase()) 
            }
        })
        .select('address username avatar bio')
        .lean();

        console.log('🔍 Online check - DB results:', users.length);

        res.json({ 
            success: true,
            online: users,
            debug: {
                addressesChecked: onlineAddresses.length,
                usersFound: users.length
            }
        });
    } catch (e) {
        console.error('❌ Get online users error:', e);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch online users',
            debug: e.message 
        });
    }
});

// Get user by address
router.get('/:address', verifyTokenId, async (req, res) => {
    try {
        const { address } = req.params;
        const onlineAddresses = getOnlineAddress().map(a => a.toLowerCase());

        const user = await User.findOne({
            address: address.toLowerCase()
        }).select('address username avatar bio isOnline lastSeen');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userWithStatus = {
            ...user.toObject(),
            isOnline: onlineAddresses.includes(user.address.toLowerCase())
        };

        res.json(userWithStatus);
    } catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
const uploadFields = uploadMiddleware.fields([
  { name: 'avatar', maxCount: 1 },     // Key gửi lên là 'avatar'
  { name: 'coverImage', maxCount: 1 }  // Key gửi lên là 'coverImage'
]);

// PUT: /api/user/profile
router.put("/update/profile", verifyToken, uploadFields, updateProfile);
router.get("/:id",verifyTokenId, getUserById);
export default router;