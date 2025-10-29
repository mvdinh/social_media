import express from 'express';
import { Post } from '../db/mongodb.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0, author } = req.query;
    const query = author ? { author } : {};
    
    const posts = await Post.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Post.countDocuments(query);

    res.json({ posts, total });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findOne({ postId: parseInt(req.params.postId) });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

export default router;