import React from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { ensureMessagingKeySynced } from './cryptoSync'; // 👉 file helper mới

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const verifySignature = async (account: string) => {
  try {
    // STEP 1: Request nonce from backend
    const nonceResponse = await axios.post(`${API_URL}/auth/nonce`, {
      address: account
    });

    const { nonce, message } = nonceResponse.data;
    console.log('✅ Nonce received:', nonce);
    console.log('📜 Message to sign:', message);

    // STEP 2: Sign the message with the wallet
    if (!window.ethereum) throw new Error('MetaMask not found.');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    let signature;
    try {
      signature = await signer.signMessage(message);
      console.log('✅ Signature obtained:', signature.slice(0, 20) + '...');
    } catch (error: any) {
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('You rejected the authentication signature');
      }
      throw error;
    }

    // STEP 3: Verify signature with backend
    const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
      address: account,
      signature,
      nonce
    });

    const { user, token } = verifyResponse.data;
    console.log('✅ Authentication successful! User:', user.username);

    // STEP 4: Ensure messaging public key is synced
    try {
      await ensureMessagingKeySynced(account);
      console.log('🔑 Messaging key synced successfully.');
    } catch (err) {
      console.error('⚠️ Failed to sync messaging key:', err);
    }

    // STEP 5: Return user and token
    return { user, token };
  } catch (err) {
    console.error('❌ Signature verification failed:', err);
    throw err;
  }
};
