import { useState, useEffect } from "react";
import { FriendList } from "./FriendList";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { connectWallet, getContract } from "../../utils/wallet";

export type FriendStatus = "RECEIVED_PENDING";

export interface Friend {
  address: string;
  name: string;
  avatar: string;
  status: FriendStatus;
  mutualFriends?: number;
}

const FriendRequestsPage = () => {
  const { address } = useAuth();
  const [requests, setRequests] = useState<Friend[]>([]);
  const [notification, setNotification] = useState<string>("");
  const [loadingTx, setLoadingTx] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // ==== FETCH RECEIVED FRIEND REQUESTS FROM BACKEND ====
  const fetchFriendRequests = async () => {
    if (!address) return;

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/friends/received`, {
        params: { currentAddress: address },
      });

      if (res.data.success) {
        const mapped: Friend[] = res.data.requests.map((u: any) => ({
          address: u.sender,
          name: u.name,
          avatar: u.avatar || "https://i.pravatar.cc/150",
          status: "RECEIVED_PENDING",
          mutualFriends: u.mutualFriends || 0,
        }));

        setRequests(mapped);
      }
    } catch (err) {
      console.error(err);
      showNotification("Lỗi khi gọi API");
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, [address]);

  // === CONTRACT FUNCTIONS ===
  const acceptFriendRequest = async (friendAddress: string) => {
    if (loadingTx) return;
    setLoadingTx(true);

    try {
      await connectWallet();
      const contract = await getContract();

      const tx = await contract.acceptFriendRequest(friendAddress);
      await tx.wait();
      showNotification("Chấp nhận lời mời thành công!");

      // Remove from UI
      setRequests(prev => prev.filter(f => f.address !== friendAddress));
    } catch (err) {
      console.error(err);
      showNotification("Chấp nhận thất bại");
    } finally {
      setLoadingTx(false);
    }
  };

  const rejectFriendRequest = async (friendAddress: string) => {
    if (loadingTx) return;
    setLoadingTx(true);

    try {
      await connectWallet();
      const contract = await getContract();

      const tx = await contract.rejectFriendRequest(friendAddress);
      await tx.wait();
      showNotification("Từ chối lời mời thành công!");

      // Remove from UI
      setRequests(prev => prev.filter(f => f.address !== friendAddress));
    } catch (err) {
      console.error(err);
      showNotification("Từ chối thất bại");
    } finally {
      setLoadingTx(false);
    }
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <h1 className="text-gray-900 mb-4 text-2xl font-semibold">Lời mời kết bạn</h1>

        {requests.length === 0 ? (
          <p className="text-gray-500 text-center py-12">Không có lời mời kết bạn nào</p>
        ) : (
          <FriendList
            friends={requests}
            onAcceptFriend={acceptFriendRequest}
            onRejectFriend={rejectFriendRequest}
          />
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;
