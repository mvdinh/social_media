import mongoose from 'mongoose';

// luu post
const MediaSchema = new mongoose.Schema(
    {
        cid: { type: String, required: true },
        name: { type: String },
        mimeType: { type: String },
        size: { type: Number }
    },
    { _id: false }
);


// luu comment
const CommentSchema = new mongoose.Schema(
    {
        author: { type: String }, // có thể thay bằng userId
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: true }
);

// dinh dang post
const PostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String },
        media: [MediaSchema],
        likes: { type: Number, default: 0 },
        comments: [CommentSchema]
    },
    { timestamps: true }
);

export default mongoose.model('Post', PostSchema);