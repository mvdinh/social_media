// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

// 🟦 Auto load all contract JSON files
function loadAllContracts() {
  const modules = import.meta.glob("../contracts/*.json", { eager: true });
  const contracts: any = {};

  for (const path in modules) {
    const name = path.split("/").pop()!.replace(".json", "");
    contracts[name] = modules[path];
  }

  return contracts;
}

interface AuthContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;

  contracts: Record<string, ethers.Contract>; // Tất cả contract
  contractAddresses: Record<string, string>;  // Lưu address từng contract

  loading: boolean;
  error: string | null;

  connectWallet: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  address: null,
  provider: null,
  signer: null,
  contracts: {},
  contractAddresses: {},
  loading: false,
  error: null,
  connectWallet: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [contracts, setContracts] = useState<Record<string, ethers.Contract>>({});
  const [contractAddresses, setContractAddresses] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet address khi refresh trang
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);

  const connectWallet = async () => {
  setError(null);
  setLoading(true);

  try {
    if (!window.ethereum) throw new Error("Please install MetaMask");

    const _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    const _signer = await _provider.getSigner();
    const _address = await _signer.getAddress();

    // Chain ID
    const network = await _provider.getNetwork();
    console.log("🔗 chainId:", network.chainId);

    // Load tất cả contract JSON
    const contractFiles = loadAllContracts();
    const loadedContracts: any = {};
    const loadedAddresses: any = {};

    for (const key in contractFiles) {
      const { address, abi } = contractFiles[key];
      loadedContracts[key] = new ethers.Contract(address, abi, _signer);
      loadedAddresses[key] = address;
    }

    // Lưu state vào context
    setProvider(_provider);
    setSigner(_signer);
    setAddress(_address);
    setContracts(loadedContracts);
    setContractAddresses(loadedAddresses);

    // Lưu vào localStorage
    localStorage.setItem("walletAddress", _address);

    console.log("📝 Loaded contracts:", Object.keys(loadedContracts));

    // ⭐⭐ TRẢ VỀ ĐẦY ĐỦ CHO LOGIN PAGE ⭐⭐
    return {
      provider: _provider,
      signer: _signer,
      address: _address,
      contracts: loadedContracts,
      contractAddresses: loadedAddresses,
    };

  } catch (err: any) {
    console.error("❌ ConnectWallet Error:", err);
    setError(err.message || "Failed to connect wallet");
    return null; // ⭐ để component biết connect fail
  } finally {
    setLoading(false);
  }
};


  const logout = () => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setContracts({});
    setContractAddresses({});
    localStorage.removeItem("walletAddress");
  };

  return (
    <AuthContext.Provider
      value={{
        address,
        provider,
        signer,
        contracts,
        contractAddresses,
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

export const useAuth = () => useContext(AuthContext);
