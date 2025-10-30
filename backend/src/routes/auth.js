import express from 'express';
import { ethers } from 'ethers';
const router = express.Router();


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