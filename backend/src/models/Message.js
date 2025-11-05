//lưu trữ tin nhắn
import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    cid: { type: String, required: true },     // IPFS CID của ciphertext
    nonce: { type: String, required: true },   // nonce secretbox
    contentType: { type: String, default: 'text/plain' },
    bytes: { type: Number },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent', index: true },
    hash: { type: String },                    // sha256 ciphertext (tùy chọn)
}, { timestamps: true });

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);