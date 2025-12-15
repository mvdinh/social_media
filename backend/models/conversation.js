import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['dm', 'group'],
        required: true
    },
    name: String, // For groups
    avatar: String, // For groups
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        textPreview: String,
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);