import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function createPost(string memory _contentCID) external returns (uint256)",
  "function likePost(uint256 _postId) external",
  "function unlikePost(uint256 _postId) external",
  "function commentPost(uint256 _postId, string memory _commentCID) external",
  "function sharePost(uint256 _postId, string memory _shareCID) external returns (uint256)",
  "function hasLiked(uint256 _postId, address _user) external view returns (bool)",
  "function getPosts() external view returns (tuple(uint256 id, address author, string contentCID, uint256 timestamp, uint256 likes)[])",
  "function getPost(uint256 _postId) external view returns (tuple(uint256 id, address author, string contentCID, uint256 timestamp, uint256 likes))"
];

interface WalletContextType {
  account: string;
  provider: ethers.BrowserProvider | null;
  contract: ethers.Contract | null;
  loading: boolean;
  error: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  executeGaslessTransaction: (txPromise: Promise<any>, successMessage: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      checkConnection();
      setupEventListeners();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('Chain changed:', chainId);
        window.location.reload();
      });
    }
  };

  const checkConnection = async () => {
    console.log('Checking MetaMask connection...');
    
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        console.log('Existing accounts:', accounts);
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    } else {
      console.log('MetaMask not detected');
      setError('MetaMask is not installed');
    }
  };

  const connectWallet = async () => {
    console.log('Attempting to connect wallet...');
    
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed. Please install MetaMask extension.');
      alert('Please install MetaMask extension first!\n\nVisit: https://metamask.io/download/');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Creating provider...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      console.log('Requesting accounts...');
      const accounts = await provider.send('eth_requestAccounts', []);
      console.log('Accounts received:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      console.log('Getting signer...');
      const signer = await provider.getSigner();
      
      console.log('Checking network...');
      const network = await provider.getNetwork();
      console.log('Current network:', network.chainId.toString());
      
      const expectedChainId = import.meta.env.VITE_CHAIN_ID || '1337';
      const expectedChainIdHex = `0x${parseInt(expectedChainId).toString(16)}`;
      
      console.log('Expected chain ID:', expectedChainId);
      console.log('Expected chain ID (hex):', expectedChainIdHex);
      
      if (network.chainId.toString() !== expectedChainId) {
        console.log('Wrong network, attempting to switch...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: expectedChainIdHex }],
          });
          console.log('Network switched successfully');
        } catch (switchError: any) {
          console.log('Switch error:', switchError);
          if (switchError.code === 4902) {
            console.log('Network not found, adding it...');
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: expectedChainIdHex,
                  chainName: 'Localhost 8545',
                  rpcUrls: ['http://127.0.0.1:8545'],
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                  }
                }]
              });
              console.log('Network added successfully');
            } catch (addError) {
              console.error('Failed to add network:', addError);
              throw new Error('Failed to add network. Please add it manually in MetaMask.');
            }
          } else if (switchError.code === 4001) {
            throw new Error('Please approve the network switch in MetaMask');
          } else {
            throw switchError;
          }
        }
      }

      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      console.log('Contract address from env:', contractAddress);
      
      if (!contractAddress) {
        throw new Error('Contract address not configured in .env file');
      }

      console.log('Creating contract instance...');
      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );

      console.log('Connection successful!');
      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contract);
      setError('');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'Connection request rejected. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      handleDisconnect();
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    console.log('Disconnecting wallet...');
    setAccount('');
    setProvider(null);
    setContract(null);
  };

  const disconnectWallet = () => {
    handleDisconnect();
  };

  // Thực hiện giao dịch không tốn ETH (gasless)
  const executeGaslessTransaction = async (
    txPromise: Promise<any>,
    successMessage: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      console.log('Executing gasless transaction...');
      
      // Thực hiện transaction
      const tx = await txPromise;
      console.log('Transaction sent:', tx.hash);
      
      // Đợi transaction được confirm
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      return {
        success: true,
        message: successMessage
      };
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      let errorMessage = 'Transaction failed';
      if (error.code === 4001) {
        errorMessage = 'Transaction rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const value: WalletContextType = {
    account,
    provider,
    contract,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    executeGaslessTransaction
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};