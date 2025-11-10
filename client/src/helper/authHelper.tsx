import axios from 'axios';
import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface AuthResult {
  success: boolean;
  signature?: string;
  address?: string;
  error?: string;
}

/**
 * Yêu cầu người dùng ký một message để xác thực
 */
export async function requestSignature(address: string): Promise<AuthResult> {
  try {
    // 1. Request nonce từ server
    const nonceResponse = await axios.post(`${API_URL}/auth/nonce`, {
      address
    });

    if (!nonceResponse.data.success) {
      return {
        success: false,
        error: 'Failed to get nonce from server'
      };
    }

    const { nonce, message } = nonceResponse.data;

    // 2. Request MetaMask signature
    if (!window.ethereum) {
      return {
        success: false,
        error: 'MetaMask is not installed'
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Sign message
    const signature = await signer.signMessage(message);

    // 3. Verify signature với server
    const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
      address,
      signature,
      nonce
    });

    if (!verifyResponse.data.success) {
      return {
        success: false,
        error: 'Signature verification failed'
      };
    }

    return {
      success: true,
      signature,
      address: verifyResponse.data.user.address
    };

  } catch (error: any) {
    console.error('❌ Error in requestSignature:', error);
    
    if (error.code === 'ACTION_REJECTED') {
      return {
        success: false,
        error: 'User rejected signature request'
      };
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Authentication failed'
    };
  }
}

/**
 * Kiểm tra xem có provider (MetaMask) không
 */
export function hasProvider(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum;
}

/**
 * Request kết nối với MetaMask
 */
export async function connectWallet(): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    if (!window.ethereum) {
      return {
        success: false,
        error: 'MetaMask is not installed'
      };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);

    if (accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found'
      };
    }

    return {
      success: true,
      address: accounts[0]
    };

  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect wallet'
    };
  }
}

// Extend Window interface
declare global {
  interface Window {
    ethereum?: any;
  }
}