import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import ipfs from '../ipfs.js';
import Post from '../models/Post.js';
import { gatewayUrl } from '../utils/gateway.js';

const router = express.Router();

// cấu hình multer để upload file
const MAX_FILE_MB = parseInt(process.env.MAX_FILE_MB || '100', 10);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024 }
});

// kt mime chỉ chấp nhận image/ và video/
const allowedMime = (m) =>
    (m && (m.startsWith('image/') || m.startsWith('video/'))) || false;

router.post('/', upload.array('files', 10), async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title) return res.status(400).json({ error: 'title_required' });

        const files = req.files || [];
        const media = [];

        for (const f of files) {
            const mimetype =
                f.mimetype || mime.lookup(f.originalname) || 'application/octet-stream';
            if (!allowedMime(mimetype)) {
                return res.status(400).json({ error: 'unsupported_mime', file: f.originalname });
            }

            // Upload và pin local để hiện trong IPFS Desktop
            const added = await ipfs.add(
                { path: f.originalname, content: f.buffer },
                { pin: true }
            );
            const cid = added.cid.toString();  // mã hash cid
            media.push({
                cid,
                name: f.originalname,
                mimeType: mimetype,
                size: f.size
            });
        }

        const post = await Post.create({ title, content, media });
        res.status(201).json({
            id: post._id,
            title: post.title,
            content: post.content,
            media: post.media.map((m) => ({ ...m, url: gatewayUrl(m.cid) })),
            likes: post.likes,
            comments: post.comments,
            createdAt: post.createdAt
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'create_post_failed', details: err.message });
    }
});

// danh sach post
router.get('/', async (req, res) => {
    try {
        // phan trang
        const page = parseInt(req.query.page ?? '1', 10);
        const limit = parseInt(req.query.limit ?? '10', 10);
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            Post.countDocuments()
        ]);

        const data = items.map((p) => ({
            id: p._id,
            title: p.title,
            content: p.content,
            media: p.media.map((m) => ({ ...m.toObject(), url: gatewayUrl(m.cid) })),
            likes: p.likes,
            comments: p.comments,
            createdAt: p.createdAt
        }));

        res.json({ page, limit, total, data });
    } catch (err) {
        res.status(500).json({ error: 'list_posts_failed', details: err.message });
    }
});

// chi tiet bai viet
router.get('/:id', async (req, res) => {
    try {
        const p = await Post.findById(req.params.id);
        if (!p) return res.status(404).json({ error: 'not_found' });
        res.json({
            id: p._id,
            title: p.title,
            content: p.content,
            media: p.media.map((m) => ({ ...m.toObject(), url: gatewayUrl(m.cid) })),
            likes: p.likes,
            comments: p.comments,
            createdAt: p.createdAt
        });
    } catch (err) {
        res.status(500).json({ error: 'get_post_failed', details: err.message });
    }
});

// like
router.post('/:id/like', async (req, res) => {
    try {
        const p = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!p) return res.status(404).json({ error: 'not_found' });
        res.json({ id: p._id, likes: p.likes });
    } catch (err) {
        res.status(500).json({ error: 'like_failed', details: err.message });
    }
});


// comment
router.post('/:id/comments', async (req, res) => {
    try {
        const { author, text } = req.body;
        if (!text) return res.status(400).json({ error: 'text_required' });

        const p = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { author, text } } },
            { new: true }
        );
        if (!p) return res.status(404).json({ error: 'not_found' });

        res.json({
            id: p._id,
            comments: p.comments
        });
    } catch (err) {
        res.status(500).json({ error: 'comment_failed', details: err.message });
    }
});

export default router;