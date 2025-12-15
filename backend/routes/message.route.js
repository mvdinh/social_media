// routes/message.route.js
import express from 'express';
import { verifyTokenId } from '../middleware/auth.js';
import User from '../models/user.js';
import Conversation from '../models/conversation.js';
import Message from '../models/message.js';
import { uploadJSONToIPFS, getIPFSMetadata } from '../services/ipfs.service.js';
import { sendToAddress } from '../services/signalingServer.js';

const router = express.Router();

/**
 * ==================================================================
 * 🛠️ HELPER: Lấy User Address an toàn
 * Vì middleware verifyTokenId có thể chỉ trả về userId
 * ==================================================================
 */
const ensureUserAddress = async (req) => {
    if (req.userAddress) return req.userAddress;
    
    const user = await User.findById(req.userId).select('address');
    if (user) {
        req.userAddress = user.address;
        return user.address;
    }
    return null;
};

/**
 * =================================
 * 📋 1. GET ALL CONVERSATIONS
 * =================================
 */
router.get('/conversations', verifyTokenId, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId
        })
            .sort({ lastMessageAt: -1 })
            .populate('participants', 'address username avatar')
            .lean();

        // Tính số tin nhắn chưa đọc
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation: conv._id,
                    sender: { $ne: req.userId },
                    'readBy.user': { $ne: req.userId }
                });

                return { ...conv, unreadCount };
            })
        );

        res.json({
            success: true,
            items: conversationsWithUnread
        });

    } catch (err) {
        console.error('Get conversations error:', err);
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

/**
 * =================================
 * 💬 2. CREATE / FIND DM CONVERSATION
 * =================================
 */
router.post('/conversations/dm', verifyTokenId, async (req, res) => {
    try {
        const { peerAddress } = req.body;
        if (!peerAddress) return res.status(400).json({ error: 'peerAddress required' });

        const normalizedPeerAddress = peerAddress.toLowerCase();
        const currentUserId = req.userId;

        const peer = await User.findOne({ address: normalizedPeerAddress });
        if (!peer) return res.status(404).json({ error: 'User not found' });

        let conversation = await Conversation.findOne({
            type: 'dm',
            participants: { $all: [currentUserId, peer._id], $size: 2 }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                type: 'dm',
                participants: [currentUserId, peer._id]
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('participants', 'address username avatar')
            .lean();

        res.json(populated);

    } catch (err) {
        console.error('Create DM error:', err);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

/**
 * =================================
 * 📨 3. SEND MESSAGE (IPFS FIRST STRATEGY)
 * Logic: JSON -> IPFS -> Hash -> MongoDB
 * =================================
 */
router.post('/', verifyTokenId, async (req, res) => {
    try {
        const { conversationId, content } = req.body;

        // A. Validate Input
        if (!conversationId || !content || !content.trim()) {
            return res.status(400).json({ error: 'Thiếu conversationId hoặc content' });
        }

        // B. Lấy Address người gửi
        const senderAddress = await ensureUserAddress(req);
        if (!senderAddress) return res.status(404).json({ error: 'User address not found' });

        // C. Kiểm tra quyền truy cập Conversation
        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'address')
            .lean();

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const isParticipant = conversation.participants.some(
            p => p.address.toLowerCase() === senderAddress.toLowerCase()
        );
        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        // ======================================================
        // 🚀 STEP 1: UPLOAD JSON TO IPFS
        // ======================================================
        const messagePayload = {
            content: content.trim(),
            sender: senderAddress,
            timestamp: Date.now(),
            type: 'text',
            conversationId: conversationId
        };

        console.log('📤 Uploading message to IPFS...');
        const ipfsHash = await uploadJSONToIPFS(messagePayload);
        console.log('✅ IPFS Hash:', ipfsHash);

        // ======================================================
        // 💾 STEP 2: SAVE HASH TO MONGODB
        // ======================================================
        const message = await Message.create({
            conversation: conversationId,
            sender: req.userId,
            ipfsHash: ipfsHash,          // Lưu Hash quan trọng nhất
            mediaType: 'text',
            textPreview: content.slice(0, 100) // Lưu preview để search nhanh (optional)
        });

        // Update Conversation Last Message
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessageAt: new Date(),
            lastMessage: {
                textPreview: content.slice(0, 50),
                sender: req.userId,
                ipfsHash: ipfsHash
            }
        });

        // ======================================================
        // 🔔 STEP 3: REAL-TIME NOTIFICATION
        // ======================================================
        
        // Populate sender để trả về Client đẹp hơn
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'address username avatar')
            .lean();

        // Gửi Realtime (Kèm content để client không cần fetch IPFS ngay lập tức)
        const messageForClient = {
            ...populatedMessage,
            content: content // Inject content vào để hiển thị ngay
        };

        conversation.participants.forEach(participant => {
            const pAddress = participant.address?.toLowerCase();
            // Không gửi lại cho chính người gửi
            if (pAddress && pAddress !== senderAddress.toLowerCase()) {
                sendToAddress(pAddress, {
                    type: 'chat:new',
                    conversationId,
                    message: messageForClient
                });
            }
        });

        res.status(201).json({
            success: true,
            message: messageForClient
        });

    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

/**
 * =================================
 * 📜 4. GET MESSAGES (AUTO FETCH FROM IPFS)
 * Logic: Get DB -> Map Hash -> Fetch IPFS -> Merge -> Return
 * =================================
 */
router.get('/messages', verifyTokenId, async (req, res) => {
    try {
        const { conversationId, limit = 50 } = req.query;

        if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

        // A. Validate Access
        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'address')
            .lean();

        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const currentUserAddress = await ensureUserAddress(req);
        const isParticipant = conversation.participants.some(
            p => p.address.toLowerCase() === currentUserAddress?.toLowerCase()
        );

        if (!isParticipant) return res.status(403).json({ error: 'Not a participant' });

        // B. Get Metadata from DB
        const messages = await Message.find({ conversation: conversationId })
            .sort({ createdAt: 1 })
            .limit(Number(limit))
            .populate('sender', 'address username avatar')
            .populate('readBy.user', 'address username')
            .lean();

        console.log(`📥 Fetching content for ${messages.length} messages from IPFS...`);

        // ======================================================
        // 🚀 STEP: PARALLEL FETCH FROM IPFS
        // ======================================================
        const messagesWithContent = await Promise.all(messages.map(async (msg) => {
            // Nếu có Hash, ưu tiên lấy từ IPFS
            if (msg.ipfsHash) {
                try {
                    const ipfsData = await getIPFSMetadata(msg.ipfsHash);
                    if (ipfsData && ipfsData.content) {
                        return {
                            ...msg,
                            content: ipfsData.content,  // Nội dung Full từ IPFS
                            mediaType: ipfsData.type || msg.mediaType
                        };
                    }
                } catch (e) {
                    console.warn(`⚠️ Failed to fetch IPFS for msg ${msg._id}: ${e.message}`);
                }
            }

            // Fallback: Nếu lỗi hoặc không có hash, dùng preview
            return {
                ...msg,
                content: msg.textPreview || "Content unavailable",
                isError: true
            };
        }));

        res.json({
            success: true,
            items: messagesWithContent
        });

    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

/**
 * =================================
 * ✅ 5. MARK READ
 * =================================
 */
router.post('/messages/read', verifyTokenId, async (req, res) => {
    try {
        const { messageIds } = req.body;
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ error: 'messageIds array required' });
        }

        const currentUserAddress = await ensureUserAddress(req);

        // Update DB
        const result = await Message.updateMany(
            {
                _id: { $in: messageIds },
                'readBy.user': { $ne: req.userId }
            },
            {
                $push: {
                    readBy: { user: req.userId, readAt: new Date() }
                }
            }
        );

        // Notify Sender
        const messages = await Message.find({ _id: { $in: messageIds } })
            .populate('sender', 'address')
            .lean();

        const senderAddresses = new Set(
            messages.map(m => m.sender?.address?.toLowerCase()).filter(Boolean)
        );

        senderAddresses.forEach(addr => {
            if (addr !== currentUserAddress?.toLowerCase()) {
                sendToAddress(addr, {
                    type: 'chat:read',
                    messageIds,
                    readBy: req.userId
                });
            }
        });

        res.json({ success: true, updatedCount: result.modifiedCount });

    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ error: 'Failed to mark read' });
    }
});

/**
 * =================================
 * 🛠️ 6. UTILITY: FETCH RAW IPFS (Optional)
 * =================================
 */
router.get('/messages/content/:hash', verifyTokenId, async (req, res) => {
    try {
        const { hash } = req.params;
        const content = await getIPFSMetadata(hash);
        if (!content) return res.status(404).json({ error: 'Content not found' });
        res.json({ success: true, data: content });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

export default router;