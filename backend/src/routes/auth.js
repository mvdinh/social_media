import express from 'express';
import { ethers } from 'ethers';
import User from '../models/User.js';

const router = express.Router();
const nonces = {}; // Lưu nonce tạm thời

// API lấy nonce
router.get('/get-nonce', (req, res) => {
  const address = req.query.address;
  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonces[address] = nonce;
  res.json({ nonce });
});

// API xác thực chữ ký
router.post('/verify-signature', (req, res) => {
  const { address, signature } = req.body;
  const nonce = nonces[address];
  if (!nonce) return res.status(400).json({ success: false, error: 'Nonce không tồn tại' });

  const message = `Xác thực hành động Like với nonce: ${nonce}`;
  const recoveredAddress = ethers.utils.verifyMessage(message, signature);

  if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
    delete nonces[address]; // Xóa nonce sau khi dùng
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: 'Chữ ký không hợp lệ' });
  }
});





export default router;