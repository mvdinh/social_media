import { useState, useEffect } from "react";
import { FriendList } from "./FriendList";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { ethers } from "ethers";
import { connectWallet, getContract } from "../../utils/wallet";

export interface Friend {
  address: string;
  name: string;
  avatar: string;
  status: "NONE" | "PENDING" | "ACCEPTED";
  mutualFriends?: number;
}

const FriendsPage = () => {
  const { address } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notification, setNotification] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleStatusChange = (friendAddress: string, newStatus: "NONE" | "PENDING" | "ACCEPTED") => {
    setFriends(prev =>
      prev.map(f => (f.address === friendAddress ? { ...f, status: newStatus } : f))
    );
  };

  // === CONTRACT FUNCTIONS ===
  const sendFriendRequest = async (friendAddress: string) => {
  const currentAddress = address || (await connectWallet());
  const contract = await getContract();

  try {
    const tx = await contract.sendFriendRequest(friendAddress);
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      console.log("✅ Gửi lời mời kết bạn thành công:", tx.hash);
      handleStatusChange(friendAddress, "PENDING");
      showNotification("Gửi lời mời kết bạn thành công!");
    } else {
      console.error("❌ Giao dịch thất bại:", tx.hash);
      handleStatusChange(friendAddress, "NONE");
      showNotification("Gửi lời mời thất bại");
    }
  } catch (err) {
    console.error("❌ Lỗi khi gửi lời mời:", err);
    handleStatusChange(friendAddress, "NONE"); // rollback
    showNotification("Gửi lời mời thất bại");
  }
};



  const cancelFriendRequest = async (friendAddress: string) => {
    const currentAddress = address || (await connectWallet());
    const contract = await getContract();

    // Optimistic update: set NONE ngay
    // handleStatusChange(friendAddress, "NONE");

    try {
      const tx = await contract.cancelFriend(friendAddress);
      await tx.wait();
      handleStatusChange(friendAddress, "NONE");
      showNotification("Hủy kết bạn thành công!");
    } catch (err) {
      console.error(err);
      handleStatusChange(friendAddress, "ACCEPTED"); // rollback
      showNotification("Hủy kết bạn thất bại");
    }
  };

  // === FETCH FRIENDS ===
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/friends/list`, {
          params: { currentAddress: address },
        });

        if (res.data.success) {
          const mapped: Friend[] = res.data.users.map((u: any) => ({
            address: u.address,
            name: u.name,
            avatar: u.avatar || "https://i.pravatar.cc/150",
            status: u.status || "LOADING",
            mutualFriends: u.mutualFriends || 0,
          }));
          setFriends(mapped);
        } else {
          showNotification("Không thể tải danh sách bạn bè");
        }
      } catch (err) {
        console.error(err);
        showNotification("Lỗi khi gọi API");
      }
    };

    if (address) fetchFriends();
  }, [address]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      {notification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-gray-900 mb-1">Bạn bè</h1>
              <p className="text-gray-500">
                {filteredFriends.length > 0
                  ? `${filteredFriends.length} người bạn`
                  : "Không tìm thấy bạn bè"}
              </p>
            </div>

            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <FriendList
          friends={filteredFriends}
          onAddFriend={sendFriendRequest}
          onCancelFriend={cancelFriendRequest}
        />
      </div>
    </div>
  );
};

export default FriendsPage;
