import { useState, useEffect } from 'react';
import { Wallet, Loader2, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
const Login = () => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check existing login
    const savedTokens = localStorage.getItem('tokens');
    const savedUser = localStorage.getItem('user');

    if (savedTokens && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setTokens(JSON.parse(savedTokens));
      setUser(parsedUser);
      setAccount(parsedUser.address);
      navigate('/feed'); // ✅ tự động sang feed nếu đã login
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) handleLogout();
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('Please install MetaMask!');
        return;
      }

      setIsConnecting(true);
      setError('');

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        setError('No account found');
        setIsConnecting(false);
        return;
      }

      const walletAddress = accounts[0];
      setAccount(walletAddress);
      await authenticateUser(walletAddress);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const authenticateUser = async (address) => {
    try {
      setIsSigning(true);
      setError('');

      // Step 1: Get nonce
      const nonceData = await api.auth.getNonce(address);
      if (!nonceData.success) throw new Error('Failed to get nonce');

      const { message, timestamp } = nonceData;

      // Step 2: Sign message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Step 3: Verify signature
      const verifyData = await api.auth.verify(address, signature, timestamp);
      if (!verifyData.success) throw new Error('Verification failed');

      const { accessToken, refreshToken, user: userData } = verifyData;
      const tokensData = { accessToken, refreshToken };

      setTokens(tokensData);
      setUser(userData);

      localStorage.setItem('tokens', JSON.stringify(tokensData));
      localStorage.setItem('user', JSON.stringify(userData));

      // ✅ chuyển hướng sau khi login thành công
      navigate('/feed');
    } catch (err) {
      console.error('❌ Auth error:', err);
      if (err.code === 4001) setError('You rejected the signature');
      else setError(err.message || 'Authentication failed');
      setAccount(null);
    } finally {
      setIsSigning(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (tokens?.refreshToken) {
        await api.auth.logout(tokens.refreshToken);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setAccount(null);
      setUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Pingup Login</h2>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting || isSigning}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
          >
            {isConnecting || isSigning ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSigning ? 'Signing...' : 'Connecting...'}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                Connect MetaMask
              </div>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700 font-medium">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Go to Feed
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
