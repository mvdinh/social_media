
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.patch('/me', authMiddleware, async (req, res) => {
    try {
        const { messagingPublicKey } = req.body || {};
        if (!messagingPublicKey) return res.status(400).json({ error: 'messagingPublicKey required' });
        const user = await User.findByIdAndUpdate(req.userId, { messagingPublicKey }, { new: true });
        res.json({ success: true, messagingPublicKey: user.messagingPublicKey });
    } catch (e) {
        console.error('users/me error', e);
        res.status(500).json({ error: 'update failed' });
    }
});

export default router;