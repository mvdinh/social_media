import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../../../story/abi.json'; 
import contractAddress from '../../../story/contractAddress.json';
import WalletContext from './WalletContext';

const CONTRACT_ADDRESS = contractAddress.address; 
const CONTRACT_ABI = abi;

// --- Khai báo các biến và hàm trong Provider ---

const WalletProvider = ({ children }) => {
    // Trạng thái (State) cần quản lý
    const [currentAccount, setCurrentAccount] = useState(null);
    const [storyManagerContract, setStoryManagerContract] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [ethersProvider, setEthersProvider] = useState(null);

    // Hàm Khởi tạo Provider/Contract
    const initializeProviderAndContract = (account) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        setCurrentAccount(account);
        setStoryManagerContract(contractInstance);
        setEthersProvider(provider);
    };

    const getSigner = () => {
        if (ethersProvider && currentAccount) {
            return ethersProvider.getSigner();
        }
        return null;
    };

    // Hàm Kết Nối Ví MetaMask
    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert("Vui lòng cài đặt MetaMask!");
            return;
        }

        setIsLoading(true);
        try {
            // Yêu cầu kết nối tài khoản
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const selectedAccount = accounts[0];
            
            initializeProviderAndContract(selectedAccount);
            
            console.log("Đã kết nối ví:", selectedAccount);

        } catch (error) {
            console.error("Lỗi kết nối ví:", error); 
            setCurrentAccount(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Lắng nghe sự kiện thay đổi (Account hoặc Chain)
    useEffect(() => {
        if (typeof window.ethereum === 'undefined') {
            setIsLoading(false);
            return;
        }

        const checkConnectedWallet = async () => {
            try {
                // Thử lấy các tài khoản đã phê duyệt MÀ KHÔNG BẬT POP-UP
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length > 0) {
                    // Nếu có tài khoản, tự động khôi phục phiên
                    initializeProviderAndContract(accounts[0]);
                }
            } catch (error) {
                console.error("Lỗi khi kiểm tra ví đã kết nối:", error);
            } finally {
                setIsLoading(false); 
            }
        };

        checkConnectedWallet();

        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) {
                window.location.reload(); 
            } else {
                setCurrentAccount(null);
                setStoryManagerContract(null);
            }
        };

        const handleChainChanged = () => {
            window.location.reload(); 
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            // Dọn dẹp listener khi component unmount
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, []);

    // Hàm Tương Tác Với Smart Contract (Hàm đăng story)
    const postStory = async (ipfsHash) => {
        if (!storyManagerContract || !currentAccount) {
            throw new Error("Ví chưa được kết nối.");
        }
        
        try {
            const tx = await storyManagerContract.postStory(ipfsHash);
            await tx.wait(); 
            return tx.hash;

        } catch (error) {
            console.error("Lỗi khi đăng Story:", error);
            throw error;
        }
    };

    // Hàm Tương Tác Với Smart Contract (Hàm đọc story)
    const getStory = async (storyId) => {
        let contractToUse = storyManagerContract;

        // Nếu chưa kết nối, tạo instance chỉ để đọc bằng Default Provider
        if (!contractToUse) {
            const defaultProvider = ethers.getDefaultProvider();
            contractToUse = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, defaultProvider);
        }

        try {
            const story = await contractToUse.getStory(storyId);
            
            return {
                id: story.id.toNumber(),
                owner: story.owner,
                ipfsHash: story.ipfsHash,
                timestamp: story.timestamp.toNumber(),
                exists: story.exists
            };

        } catch (error) {
            console.error(`Lỗi khi lấy Story ID ${storyId}:`, error);
            throw error;
        }
    };

    // 7. Giá trị (Value) cung cấp cho các component con
    const value = {
        currentAccount,
        storyManagerContract, // Cung cấp instance contract
        isLoading,
        connectWallet,
        getSigner,
        postStory,
        getStory,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
};

export default WalletProvider;