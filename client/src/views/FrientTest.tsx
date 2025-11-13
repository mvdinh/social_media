import { ethers } from "ethers";
import axios from "axios";
import FriendSystemConf from "../config/friendSystem.json";
import { useState, useEffect } from "react";

interface User {
  name: string;
  address: string;
}

interface FriendRequest {
  _id: string;
  sender: string;
  receiver: string;
  status: string;
}

interface Friend {
  name: string;
  address: string;
}

const FriendTest: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [loadingLogin, setLoadingLogin] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  // ======================
  // Login Metamask
  // ======================
  const login = async () => {
    if (!window.ethereum) return alert("Metamask not found!");
    setLoadingLogin(true);
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const _provider = new ethers.BrowserProvider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      const _signer = await _provider.getSigner();
      const _address = await _signer.getAddress();

      const _contract = new ethers.Contract(
        FriendSystemConf.address,
        FriendSystemConf.abi,
        _signer
      );

      setProvider(_provider);
      setSigner(_signer);
      setWalletAddress(_address);
      setContract(_contract);

      console.log("✅ Logged in as", _address);
    } catch (err: any) {
      console.error(err);
      alert("❌ Login failed: " + err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  // ======================
  // Logout
  // ======================
  const logout = () => {
    setWalletAddress(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setUsers([]);
    setRequests([]);
    setFriends([]);
    console.log("🚪 Logged out");
  };

  // ======================
  // Load all users
  // ======================
  const loadAllUsers = async () => {
    if (!walletAddress) return;
    setLoadingUsers(true);
    try {
      const response = await axios.get("http://localhost:5000/api/auth/getAllUser");
      // Nếu API trả { success: true, data: [...] }
      const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      setUsers(data);
    } catch (err) {
      console.error("❌ Load users error:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ======================
  // Load friend requests
  // ======================
  const loadFriendRequests = async () => {
    if (!walletAddress) return;
    setLoadingRequests(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/fr/requests/${walletAddress}`);
      const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      setRequests(data);
    } catch (err) {
      console.error("❌ Load requests error:", err);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ======================
  // Send friend request
  // ======================
  const sendFriendRequest = async (target: string) => {
    if (!contract || !walletAddress) return alert("Contract not ready");
    setLoadingAction(true);
    try {
      const response = await axios.post("http://localhost:5000/api/fr/request", {
        sender: walletAddress,
        receiver: target,
      });
      const newRequest = response.data?.data ?? response.data;
      if (newRequest) setRequests((prev) => [...prev, newRequest]);
      alert(`📨 Sent friend request to ${target.slice(0, 10)}...`);
    } catch (err: any) {
      console.error(err);
      alert("❌ Transaction failed: " + (err.response?.data?.error || err.message || "Unknown error"));
    } finally {
      setLoadingAction(false);
    }
  };

  // ======================
  // Accept friend request
  // ======================
  const acceptFriendRequest = async (req: FriendRequest) => {
    if (!contract || !walletAddress) return alert("Contract not ready");
    setLoadingAction(true);
    try {
      await axios.post("http://localhost:5000/api/fr/accept", {
        sender: walletAddress,
        receiver: req.sender,
      });
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
      alert(`✅ Accepted friend request from ${req.sender.slice(0, 10)}...`);
    } catch (err: any) {
      console.error(err);
      alert("❌ Transaction failed: " + (err.response?.data?.error || err.message || "Unknown error"));
    } finally {
      setLoadingAction(false);
    }
  };

  // ======================
  // useEffect load khi login
  // ======================
  useEffect(() => {
    if (walletAddress) {
      loadAllUsers();
      loadFriendRequests();
    }
  }, [walletAddress]);

  // ======================
  // View
  // ======================
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h2>Friend System DApp</h2>

      {!walletAddress ? (
        <button
          onClick={login}
          disabled={loadingLogin}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            cursor: loadingLogin ? "not-allowed" : "pointer",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          {loadingLogin ? "Connecting..." : "Login with Metamask"}
        </button>
      ) : (
        <div>
          <div style={{ backgroundColor: "#f5f5f5", padding: 10, borderRadius: 4, marginBottom: 20 }}>
            <strong>Wallet:</strong> {walletAddress}
            <button
              onClick={logout}
              style={{
                marginLeft: 15,
                padding: "5px 15px",
                cursor: "pointer",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 4,
              }}
            >
              Logout
            </button>
          </div>

          {/* USERS */}
          <h3>Other Users</h3>
          <button onClick={loadAllUsers} disabled={loadingUsers} style={{ marginBottom: 10 }}>
            {loadingUsers ? "Loading..." : "Refresh Users"}
          </button>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Name</th>
                <th style={{ padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Address</th>
                <th style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.address}>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>{user.name}</td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>{user.address}</td>
                    <td style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>
                      <button
                        onClick={() => sendFriendRequest(user.address)}
                        disabled={loadingAction}
                        style={{
                          padding: "5px 15px",
                          cursor: loadingAction ? "not-allowed" : "pointer",
                          backgroundColor: "#2196F3",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                        }}
                      >
                        Add Friend
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* FRIEND REQUESTS */}
          <h3>Friend Requests</h3>
          <button onClick={loadFriendRequests} disabled={loadingRequests} style={{ marginBottom: 10 }}>
            {loadingRequests ? "Loading..." : "Refresh Requests"}
          </button>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Sender</th>
                <th style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>Status</th>
                <th style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(requests) && requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req._id}>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>{req.sender}</td>
                    <td style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>{req.status}</td>
                    <td style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>
                      <button
                        onClick={() => acceptFriendRequest(req)}
                        disabled={loadingAction}
                        style={{
                          padding: "5px 15px",
                          cursor: loadingAction ? "not-allowed" : "pointer",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                        }}
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>
                    No pending requests
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* FRIENDS */}
          <h3>My Friends</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Name</th>
                <th style={{ padding: 10, textAlign: "left", border: "1px solid #ddd" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(friends) && friends.length > 0 ? (
                friends.map((f) => (
                  <tr key={f.address}>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>{f.name}</td>
                    <td style={{ padding: 10, border: "1px solid #ddd" }}>{f.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: 10, textAlign: "center", border: "1px solid #ddd" }}>
                    No friends yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FriendTest;
