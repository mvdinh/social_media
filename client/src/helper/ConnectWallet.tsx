import { ethers } from "ethers";
import contractAddress from '../config/contract-address.json';
import contractABI from '../config/SocialMedia.json';

const WALLET_KEY = 'wallet_account';
const CONTRACT_KEY = 'social_contract';

// Lưu account vào localStorage
const saveAccount = (account: string) => localStorage.setItem(WALLET_KEY, account);

// Lấy account từ localStorage
export const getAccount = (): string | null => localStorage.getItem(WALLET_KEY);

// Xóa account khi disconnect
export const clearAccount = () => localStorage.removeItem(WALLET_KEY);

// ===============================================
// Connect Wallet
// ===============================================
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return null;
    }

    
    await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    await web3Provider.send('eth_requestAccounts', []);
    const userSigner = await web3Provider.getSigner();
    const userAccount = await userSigner.getAddress();

    // Lưu account vào localStorage
    saveAccount(userAccount);

    // Khởi tạo contract
    const socialMediaContract = new ethers.Contract(
      contractAddress.SocialMedia,
      contractABI.abi,
      userSigner
    );

    // Nếu có hàm loadPosts, gọi

    console.log('✅ Wallet connected:', userAccount);

    return { account: userAccount, provider: web3Provider, contract: socialMediaContract };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  } finally {
    
  }
};
