import { ethers } from 'ethers';

// Import contract ABI và địa chỉ
import contractABI from '../config/SocialMedia.json';
import contractAddress from '../config/contract-address.json';

/**
 * 🦊 Kết nối ví MetaMask nếu chưa kết nối
 */
export const connectWallet = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      alert('⚠️ Vui lòng cài đặt MetaMask trước!');
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    const account = accounts[0];
    console.log('✅ Ví đã kết nối:', account);
    return account;
  } catch (error) {
    console.error('❌ Lỗi khi kết nối ví:', error);
    alert('Không thể kết nối ví. Hãy thử lại!');
    return null;
  }
};

/**
 * ⚙️ Lấy contract có signer (cho phép gọi hàm ghi)
 */
export const getContract = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // 🔐 Kiểm tra đã kết nối ví chưa
    const accounts = await provider.send('eth_accounts', []);
    if (accounts.length === 0) {
      console.log('🦊 Chưa có ví nào kết nối. Đang yêu cầu đăng nhập...');
      const account = await connectWallet();
      if (!account) throw new Error('Wallet connection required');
    }

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      contractAddress.SocialMedia,
      contractABI.abi,
      signer
    );

    console.log('✅ Contract instance created with signer:', await signer.getAddress());
    return contract;
  } catch (error) {
    console.error('❌ Error creating contract:', error);
    throw error;
  }
};

/**
 * 📖 Lấy contract chỉ đọc (không cần ví)
 */
export const getContractReadOnly = () => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress.SocialMedia,
      contractABI.abi,
      provider
    );

    return contract;
  } catch (error) {
    console.error('❌ Error creating read-only contract:', error);
    throw error;
  }
};

/**
 * 🔍 Kiểm tra xem ví có kết nối chưa
 */
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) return false;
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

/**
 * 👤 Lấy địa chỉ ví hiện tại
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) return null;
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};
