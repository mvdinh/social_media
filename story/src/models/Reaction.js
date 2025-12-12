import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
    // Hash của Story mà Reaction này thuộc về
    storyHash: {
        type: String,
        required: true,
        index: true, // Đánh index để truy vấn nhanh hơn
    },
    reactionType: {
        type: String,
        required: true,
        index: true, 
    },
    // Bộ đếm số lần Reaction
    count: {
        type: Number,
        required: true,
        default: 0,
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Đảm bảo chỉ có một bản ghi cho mỗi StoryHash và ReactionType
ReactionSchema.index({ storyHash: 1, reactionType: 1 }, { unique: true });

const Reaction = mongoose.model('Reaction', ReactionSchema);

export default Reaction;