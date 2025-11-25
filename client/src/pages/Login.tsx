import { useAuth } from "../context/AuthContext";
import { Wallet, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast, Toaster } from "sonner";

const Login = () => {
  const { connectWallet, loading, error } = useAuth();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleConnect = async () => {
    setLocalError("");

    try {
      // 1. Connect wallet
      const result = await connectWallet();

      if (!result) {
        setLocalError("Failed to connect wallet");
        return;
      }

      if (!result.address) {
        setLocalError("Wallet address not found");
        return;
      }

      console.log("🔐 Wallet connected:", result.address);
      console.log("📦 Loaded contracts:", Object.keys(result.contracts));

      // 2. Check và đăng ký user vào Account contract
      const accountContract = result.contracts["acc"];
      
      if (!accountContract) {
        console.error("❌ Account contract not found");
        setLocalError("Account contract not loaded");
        return;
      }

      setRegistering(true);
      toast.loading("Đang kiểm tra tài khoản...", { id: "register-toast" });

      try {
        // Kiểm tra user đã đăng ký chưa
        const isRegistered = await accountContract.isUserRegistered(result.address);
        console.log("📋 User registered status:", isRegistered);

        if (!isRegistered) {
          console.log("🆕 Registering new user...");
          toast.loading("Đang đăng ký tài khoản...", { id: "register-toast" });

          // Đăng ký user mới
          const tx = await accountContract.register();
          console.log("⏳ Transaction sent:", tx.hash);
          
          await tx.wait();
          console.log("✅ User registered successfully!");
          
          toast.success("Đăng ký tài khoản thành công!", { id: "register-toast" });
        } else {
          console.log("👤 User already registered");
          toast.success("Đăng nhập thành công!", { id: "register-toast" });
        }

        // 3. Chờ một chút để transaction được xác nhận
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Chuyển trang
        console.log("🚀 Navigating to feed...");
        navigate("/feed");

      } catch (registerError: any) {
        console.error("❌ Registration error:", registerError);
        
        if (registerError.code === 4001) {
          toast.error("Bạn đã từ chối giao dịch", { id: "register-toast" });
          setLocalError("User rejected transaction");
        } else if (registerError.message?.includes("Da dang ky roi")) {
          // Nếu đã đăng ký rồi (có thể do race condition)
          console.log("✅ User already registered (caught in error)");
          toast.success("Đăng nhập thành công!", { id: "register-toast" });
          navigate("/feed");
        } else {
          toast.error("Không thể đăng ký tài khoản", { id: "register-toast" });
          setLocalError("Registration failed: " + registerError.message);
        }
      } finally {
        setRegistering(false);
      }

    } catch (err: any) {
      console.error("❌ Connection error:", err);
      setLocalError(err.message || "Connection failed");
      toast.error("Không thể kết nối ví", { id: "register-toast" });
    }
  };

  const isLoading = loading || registering;

  return (
    <div className="relative min-h-screen flex items-center">
      <Toaster position="top-center" richColors />
      
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

              {(error || localError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error || localError}
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {registering ? "Registering..." : "Connecting..."}
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect with MetaMask
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {registering 
                  ? "Đang đăng ký tài khoản của bạn vào blockchain..."
                  : "Lần đầu đăng nhập sẽ tự động tạo tài khoản"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;