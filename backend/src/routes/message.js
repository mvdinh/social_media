// routes/messages.js
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ipfsService from '../services/ipfsService.js';
import { sendToAddress } from '../services/signalingServer.js';

const router = express.Router();

/**
 * Upload ciphertext base64 -> Helia IPFS
 * Body: { b64: string, filename?: string }
 */
router.post('/uploadEncrypted', authMiddleware, async (req, res) => {
    try {
        const { b64, filename = 'msg.bin' } = req.body || {};
        if (!b64) return res.status(400).json({ error: 'b64 required' });
        const buffer = Buffer.from(b64, 'base64');
        const { hash } = await ipfsService.addFile(buffer, filename);
        return res.json({ cid: hash, bytes: buffer.length });
    } catch (e) {
        console.error('uploadEncrypted error', e);
        return res.status(500).json({ error: 'upload failed' });
    }
});

/**
 * Fetch ciphertext from IPFS (base64)
 * GET /fetchEncrypted?cid=<cid>
 */
router.get('/fetchEncrypted', authMiddleware, async (req, res) => {
    try {
        const { cid } = req.query || {};
        if (!cid) return res.status(400).json({ error: 'cid required' });
        const { content } = await ipfsService.getFile(String(cid));
        const b64 = content.toString('base64');
        return res.json({ cid, b64, bytes: content.length });
    } catch (e) {
        console.error('fetchEncrypted error', e);
        return res.status(500).json({ error: 'fetch failed' });
    }
});

/**
 * Create (or get) DM conversation by peerAddress
 * Body: { peerAddress: string }
 */
router.post('/conversations/dm', authMiddleware, async (req, res) => {
    const meId = req.userId;
    const { peerAddress } = req.body || {};
    if (!peerAddress) return res.status(400).json({ error: 'peerAddress required' });

    const peer = await User.findOne({ address: String(peerAddress).toLowerCase() });
    if (!peer) return res.status(404).json({ error: 'Peer not found' });

    let conv = await Conversation.findOne({
        type: 'dm',
        participants: { $all: [meId, peer._id], $size: 2 }
    });

    if (!conv) {
        const me = await User.findById(meId).lean();
        if (!me?.messagingPublicKey || !peer?.messagingPublicKey) {
            return res.status(400).json({ error: 'Missing messaging public key for one or both users' });
        }
        conv = await Conversation.create({
            type: 'dm',
            participants: [meId, peer._id],
            e2e: { publicKeys: { [meId]: me.messagingPublicKey, [peer._id]: peer.messagingPublicKey } }
        });
    }

    res.json(conv);
});

/**
 * List conversations for current user (cursor by updatedAt)
 */
router.get('/conversations', authMiddleware, async (req, res) => {
    const { cursor, limit = 20 } = req.query;
    const q = { participants: req.userId };
    if (cursor) q.updatedAt = { $lt: new Date(String(cursor)) };

    const items = await Conversation.find(q)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .lean();

    const nextCursor = items.length ? items[items.length - 1].updatedAt : null;
    res.json({ items, nextCursor });
});

/**
 * List messages by conversation (cursor by createdAt)
 */
router.get('/messages', authMiddleware, async (req, res) => {
    const { conversationId, cursor, limit = 50 } = req.query;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const q = { conversation: String(conversationId) };
    if (cursor) q.createdAt = { $lt: new Date(String(cursor)) };

    const items = await Message.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    const nextCursor = items.length ? items[items.length - 1].createdAt : null;
    res.json({ items: items.reverse(), nextCursor });
});

/**
 * Create message metadata (and emit realtime)
 * Body: { conversationId, cid, nonce, contentType?, bytes?, hash?, preview? }
 */
router.post('/messages', authMiddleware, async (req, res) => {
    const { conversationId, cid, nonce, contentType = 'text/plain', bytes, hash, preview = '' } = req.body || {};
    if (!conversationId || !cid || !nonce) return res.status(400).json({ error: 'conversationId, cid, nonce required' });

    const msg = await Message.create({
        conversation: conversationId,
        sender: req.userId,
        cid, nonce, contentType, bytes, hash
    });

    const conv = await Conversation.findByIdAndUpdate(
        conversationId,
        { lastMessageAt: new Date(), lastMessage: { textPreview: preview, cid, sender: req.userId } },
        { new: true }
    ).populate('participants', 'address').lean();

    // Emit tới các participant khác
    const fromAddr = req.userAddress?.toLowerCase();
    const participants = conv?.participants?.map(p => p.address?.toLowerCase()) || [];
    participants
        .filter(addr => addr !== fromAddr)
        .forEach(addr => {
            sendToAddress(addr, { type: 'chat:new', conversationId, message: { ...msg, status: 'sent' } });
        });

    res.status(201).json(msg);
});

/**
 * Delivered / Read receipts
 */
router.post('/messages/:id/delivered', authMiddleware, async (req, res) => {
    const doc = await Message.findByIdAndUpdate(req.params.id, { status: 'delivered' }, { new: true });
    if (doc) {
        const conv = await Conversation.findById(doc.conversation).populate('participants', 'address').lean();
        conv.participants
            .map(p => p.address?.toLowerCase())
            .filter(addr => addr !== req.userAddress?.toLowerCase())
            .forEach(addr => sendToAddress(addr, { type: 'chat:delivered', messageId: String(doc._id) }));
    }
    res.json({ ok: true });
});

router.post('/messages/:id/read', authMiddleware, async (req, res) => {
    const doc = await Message.findByIdAndUpdate(req.params.id, { status: 'read' }, { new: true });
    if (doc) {
        const conv = await Conversation.findById(doc.conversation).populate('participants', 'address').lean();
        conv.participants
            .map(p => p.address?.toLowerCase())
            .filter(addr => addr !== req.userAddress?.toLowerCase())
            .forEach(addr => sendToAddress(addr, { type: 'chat:read', messageId: String(doc._id) }));
    }
    res.json({ ok: true });
});

export default router;