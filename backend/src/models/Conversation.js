// lưu trữ đoạn chat
import mongoose from 'mongoose';
const { Schema } = mongoose;

const ConversationSchema = new Schema({
    type: { type: String, enum: ['dm', 'group'], default: 'dm' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date, index: true },
    lastMessage: {
        textPreview: String,
        cid: String,
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    e2e: {
        algo: { type: String, default: 'x25519-xsalsa20-poly1305' },
        publicKeys: { type: Map, of: String }, // userId -> messagingPublicKey
        version: { type: Number, default: 1 },
    }
}, { timestamps: true });

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

export default mongoose.model('Conversation', ConversationSchema);