import express from 'express';
import { ethers } from 'ethers';
import User from '../models/user.model.js'
const router = express.Router();

router.post('/add', async (req, res) => {
  try {
    const usersToCreate = [
      { address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' },
      { address: '0x976ea74026e726554db657fa54763abd0c3a0aa9' },
      { address: '0x1234567890abcdef1234567890abcdef12345678' } // user thứ 3
    ];

    const createdUsers = await User.insertMany(usersToCreate, { ordered: false });

    return res.status(201).json({
      success: true,
      message: `${createdUsers.length} users created successfully`,
      data: createdUsers
    });
  } catch (err) {
    console.error('Add 3 users error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});


router.post('/register', async (req, res) => {
  try {
    const { acc } = req.body;

    if (!acc) {
      return res.status(400).json({ error: 'Address is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ address: acc });
    if (existingUser) {
      // Nếu đã tồn tại thì trả về 200 OK
      return res.status(200).json({ success: true, data: existingUser });
    }

    // Nếu chưa thì tạo mới
    const newUser = await User.create({ address: acc });

    return res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/getAllUser', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
// Get all users except the requester
router.get('/allUser/exceptMe', async (req, res) => {
  try {
    const { myAddress } = req.query; // or req.body if POST

    if (!myAddress) {
      return res.status(400).json({ error: 'Your address is required' });
    }

    // Fetch all users except the requester
    const users = await User.find({ address: { $ne: myAddress } });

    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// Generate nonce endpoint
router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    // Tạo nonce ngẫu nhiên
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Sign this message to authenticate: ${nonce}`;

    res.json({
      success: true,
      nonce,
      message
    });

  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

// Verify signature endpoint
router.post('/verify', async (req, res) => {
  try {
    const { address, signature, nonce } = req.body;

    if (!address || !signature || !nonce) {
      return res.status(400).json({ error: 'Address, signature and nonce required' });
    }

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const normalizedAddress = address.toLowerCase();

    // Verify signature với nonce từ client
    const message = `Sign this message to authenticate: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    res.json({
      success: true,
      user: {
        address: normalizedAddress
      },
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({ error: 'Failed to verify signature' });
  }
});

export default router;