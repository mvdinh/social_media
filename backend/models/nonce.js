
import mongoose from "mongoose";

const NonceSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true, lowercase: true },
  nonce: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
});

export default mongoose.model("Nonce", NonceSchema);