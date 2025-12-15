import React, { createContext, useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { ethers, BrowserProvider } from "ethers";

/* ================================
   LOAD ALL CONTRACT JSON FILES
================================ */
function loadAllContracts() {
  const modules = import.meta.glob("../contracts/*.json", { eager: true });
  const contracts: any = {};

  for (const path in modules) {
    const name = path.split("/").pop()!.replace(".json", "");
    contracts[name] = modules[path];
  }

  return contracts;
}

/* ================================
   TYPES
================================ */
interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
}

interface Auth1ContextType {
  user: User | null;
  isAuthenticated: boolean;

  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;

  contracts: Record<string, ethers.Contract>;
  contractAddresses: Record<string, string>;

  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

/* ================================
   CONTEXT
================================ */
const Auth1Context = createContext<Auth1ContextType>({} as Auth1ContextType);

/* ================================
   PROVIDER
================================ */
export const Auth1Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  const [contracts, setContracts] = useState<Record<string, ethers.Contract>>({});
  const [contractAddresses, setContractAddresses] = useState<Record<string, string>>({});

  /* ================================
     LOAD USER + WALLET WHEN REFRESH
  ================================ */
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedAddress = localStorage.getItem("userAddress");

    if (token && storedAddress) {
      setUser({
        id: localStorage.getItem("id") || "local",
        address: storedAddress
      });

      // restore provider & contracts
      restoreWallet(storedAddress);
    }
  }, []);

  /* ================================
     RESTORE WALLET + CONTRACTS
  ================================ */
  const restoreWallet = async (address: string) => {
    if (!window.ethereum) return;

    const _provider = new BrowserProvider(window.ethereum);
    const _signer = await _provider.getSigner();

    const contractFiles = loadAllContracts();
    const loadedContracts: any = {};
    const loadedAddresses: any = {};

    for (const key in contractFiles) {
      const { address: contractAddress, abi } = contractFiles[key];
      loadedContracts[key] = new ethers.Contract(contractAddress, abi, _signer);
      loadedAddresses[key] = contractAddress;
    }

    setProvider(_provider);
    setSigner(_signer);
    setContracts(loadedContracts);
    setContractAddresses(loadedAddresses);
  };

  /* ================================
     LOGIN
  ================================ */
  const login = async () => {
    setIsLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("Vui lòng cài MetaMask");
      }

      const _provider = new BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const address = await _signer.getAddress();

      // 1. Get nonce
      const nonceRes = await axiosClient.get(`/auth/nonce/${address}`);
      const { nonce } = nonceRes.data;

      // 2. Sign message
      const message = `Nonce: ${nonce}`;
      const signature = await _signer.signMessage(message);

      // 3. Login backend
      const loginRes = await axiosClient.post("/auth/login", {
        address,
        signature
      });

      const { accessToken, refreshToken, user: userData } = loginRes.data;

      // 4. Save token
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userAddress", userData.address);
      localStorage.setItem("id", userData.id);

      // 5. Load contracts
      const contractFiles = loadAllContracts();
      const loadedContracts: any = {};
      const loadedAddresses: any = {};

      for (const key in contractFiles) {
        const { address: contractAddress, abi } = contractFiles[key];
        loadedContracts[key] = new ethers.Contract(contractAddress, abi, _signer);
        loadedAddresses[key] = contractAddress;
      }

      // 6. Set state
      setUser(userData);
      setProvider(_provider);
      setSigner(_signer);
      setContracts(loadedContracts);
      setContractAddresses(loadedAddresses);

      console.log("✅ LOGIN + LOAD CONTRACTS OK");

    } catch (error: any) {
      console.error("❌ Login Failed:", error);
      alert(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================================
     LOGOUT
  ================================ */
  const logout = async () => {
    setIsLoading(true);

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await axiosClient.post("/auth/logout", { refreshToken });
      }
    } catch (e) {
      console.error("Logout API error:", e);
    } finally {
      localStorage.clear();

      setUser(null);
      setProvider(null);
      setSigner(null);
      setContracts({});
      setContractAddresses({});
      setIsLoading(false);
    }
  };

  return (
    <Auth1Context.Provider
      value={{
        user,
        isAuthenticated: !!user,

        provider,
        signer,
        contracts,
        contractAddresses,

        login,
        logout,
        isLoading
      }}
    >
      {children}
    </Auth1Context.Provider>
  );
};

export const useAuth1 = () => useContext(Auth1Context);
