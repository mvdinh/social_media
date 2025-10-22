import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import postsRouter from './routes/Post.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/posts', postsRouter);

const PORT = process.env.PORT || 4000;

async function start() {
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(PORT, () => {
        console.log(`API running at http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
});