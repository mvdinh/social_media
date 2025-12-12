import React, { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { ethers, BrowserProvider } from "ethers";

interface User {
  id: string;
  address: string;
  username?: string;
  avatar?: string;
}

interface Auth1ContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const Auth1Context = createContext<Auth1ContextType>({} as Auth1ContextType);

export const Auth1Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Load user khi F5
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedAddress = localStorage.getItem("userAddress");
    
    if (token && storedAddress) {
      setUser({
        id: "local",
        address: storedAddress,
      });
    }
  }, []);

  // 2. LOGIN
  const login = async () => {
    setIsLoading(true);
    try {
      if (!window.ethereum) throw new Error("Vui lòng cài MetaMask");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Wallet:", address);

      // Lấy nonce
      const nonceRes = await axiosClient.get(`/auth/nonce/${address}`);
      const { nonce } = nonceRes.data;

      const message = `Nonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // Gửi signature
      const loginRes = await axiosClient.post("/auth/login", {
        address,
        signature
      });

      const { accessToken, refreshToken, user: userData } = loginRes.data;

      // Lưu token
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userAddress", userData.address);

      setUser(userData);
      console.log("LOGIN OK!");

    } catch (error: any) {
      console.error("Login Failed:", error);
      alert(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. LOGOUT
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userAddress");

      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <Auth1Context.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading
    }}>
      {children}
    </Auth1Context.Provider>
  );
};

export const useAuth1 = () => useContext(Auth1Context);
