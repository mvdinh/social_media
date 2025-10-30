import { useState } from "react";
import { ethers } from "ethers";

const API_URL = "http://localhost:5000/api/auth";

const CheckCreatePost = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Đăng nhập với MetaMask
  const handleLogin = async () => {
    try {
      setLoading(true);
      
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      // Kết nối ví
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const address = accounts[0];
      setAccount(address);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Lấy nonce
      const nonceRes = await fetch(`${API_URL}/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const { message } = await nonceRes.json();

      // Ký message
      const signature = await signer.signMessage(message);

      // Xác thực
      await fetch(`${API_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });

      alert("Login successful!");

    } catch (err: any) {
      if (err.code === 4001) {
        alert("Signature rejected!");
      } else {
        alert("Login failed!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Like với nonce
  const handleLike = async () => {
    if (!account) {
      alert("Please login first!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Lấy nonce mới cho like
      const nonceRes = await fetch(`${API_URL}/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account }),
      });

      const { message } = await nonceRes.json();

      // Ký message like với nonce
      const signature = await signer.signMessage(message);

      console.log("Like signature:", signature);
      alert("Like successful!");

    } catch (err: any) {
      if (err.code === 4001) {
        alert("Like signature rejected!");
      } else {
        alert("Like failed!");
      }
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>MetaMask Demo</h1>
      
      {account ? (
        <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button 
          onClick={handleLogin}
          disabled={loading}
          style={{ 
            padding: "10px 20px", 
            margin: "10px",
            backgroundColor: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Connecting..." : "Login"}
        </button>
      )}

      <button 
        onClick={handleLike}
        disabled={!account}
        style={{ 
          padding: "10px 20px", 
          margin: "10px",
          backgroundColor: !account ? "#ccc" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: !account ? "not-allowed" : "pointer"
        }}
      >
        Like
      </button>
    </div>
  );
};

export default CheckCreatePost;