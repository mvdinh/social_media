// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import FriendSystemConf from "../config/friendSystem.json";

interface AuthContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>; // mở popup MetaMask để ký giao dịch
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  address: null,
  provider: null,
  signer: null,
  contract: null,
  loading: false,
  error: null,
  connectWallet: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khi load trang, lấy address từ localStorage để hiển thị UI
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  // Hàm kết nối wallet và khởi tạo signer + contract
  const connectWallet = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask");

      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []); // luôn hiển thị popup
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();
      // Kiểm tra chainId hiện tại
      const network = await _provider.getNetwork();
      console.log('chainId: ', network.chainId)
      
      const _contract = new ethers.Contract(
        FriendSystemConf.address,
        FriendSystemConf.abi,
        _signer
      );

      // Lưu vào state context
      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAddress(_address);

      // Lưu address vào localStorage để refresh vẫn hiển thị user
      localStorage.setItem("walletAddress", _address);

      console.log("✅ Wallet connected:", _address);
      return _address;
    } catch (err: any) {
      console.error("❌ Connect wallet error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  // Logout: xóa state và localStorage
  const logout = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    localStorage.removeItem("walletAddress");
  };

  return (
    <AuthContext.Provider
      value={{
        address,
        provider,
        signer,
        contract,
        loading,
        error,
        connectWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook tiện dụng
export const useAuth = () => useContext(AuthContext);
