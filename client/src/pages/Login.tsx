import { useAuth } from "../context/AuthContext";
import { Wallet, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const { connectWallet, address, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleConnect = async () => {
    const connectedAddress = await connectWallet();
    if (connectedAddress) {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/register`,
    {
      acc: connectedAddress,
    }
    );

    if (response) {
      console.log('user', response.data);
      navigate("/feed");
    }
  }
};


  return (
    <div className="relative min-h-screen flex items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 -z-10"></div>

      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <span className="text-2xl font-bold text-gray-800">Pingup</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mt-20 md:mt-0">
          <div className="text-left order-2 md:order-1">
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-gray-800">
              More than just friends{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                truly connect
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with the global community on Pingup using Web3 technology.
            </p>
          </div>

          <div className="order-1 md:order-2">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
                <p className="text-gray-600">Connect your wallet to continue</p>
              </div>

              {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect with MetaMask
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
