import { useContext } from 'react'; 
import WalletContext from './WalletContext';

// Hook tùy chỉnh
const useWallet = () => {
    const context = useContext(WalletContext);
    
    // Kiểm tra xem hook có được sử dụng trong Provider không
    if (context === null) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    
    return context;
};

export default useWallet;