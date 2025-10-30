import { useState, useEffect } from 'react';
import { Wallet, LogOut, CheckCircle, Users, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load account từ localStorage khi mount
  useEffect(() => {
    const acc = getAccount();
    if (acc) setAccount(acc);
  }, []);

  const handleConnect = async () => {
    const wallet = connectWallet(); // ví dụ hàm lấy ví từ người dùng

  localStorage.setItem("wallet", JSON.stringify(wallet));
  navigate("/feed"); // hoặc reload để kích hoạt ProtectedRoute
  };


  return (
    <div className="relative min-h-screen flex items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 -z-10"></div>

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="absolute top-6 left-6 md:top-10 md:left-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-2xl font-bold text-gray-800">Pingup</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-20 md:mt-0">
          <div className="text-left order-2 md:order-1">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-gray-800">
              More than just friends{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                truly connect
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with global community on Pingup using Web3 technology.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
              {!isAuthenticated ? (
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
                    <p className="text-gray-600">Connect your wallet to continue</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {isSigning && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <p className="text-blue-700 font-semibold">Authenticating...</p>
                      </div>
                      <p className="text-blue-600 text-sm">Please sign the message in MetaMask</p>
                    </div>
                  )}

                  <button
                    onClick={connectWallet}
                    disabled={isConnecting || isSigning}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                  >
                    {isConnecting || isSigning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {isSigning ? 'Signing...' : 'Connecting...'}
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Connect with MetaMask
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
                      <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back! 🎉</h2>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{user.username}</h3>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Wallet Address</p>
                      <p className="text-lg font-mono font-semibold text-gray-700 bg-white px-4 py-2 rounded-lg">
                        {formatAddress(user.address)}
                      </p>
                    </div>

                    {balance !== null && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Balance</p>
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                          {balance} ETH
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => window.location.href = '/dashboard'}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
                    >
                      Go to Dashboard
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;