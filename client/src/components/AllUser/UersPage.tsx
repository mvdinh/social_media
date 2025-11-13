import { useState, useEffect } from "react";
import { FriendList } from "./FriendList";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
interface FriendsPageProps {
  currentAddress: string;
}

const FriendsPage = () =>  {
  const { address } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notification, setNotification] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleUnfriend = (address: string) => {
    const friend = friends.find(f => f.address === address);
    if (friend) {
      showNotification(`Đã hủy kết bạn với ${friend.name}`);
      setFriends(prev => prev.filter(f => f.address !== address));
    }
  };

  // Lọc bạn bè theo từ khóa tìm kiếm
  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch danh sách từ API
 useEffect(() => {
  const fetchFriends = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/friends/list`,
        {currentAddress: address } 
      );
      if (res.data.success) {
        const mapped: Friend[] = res.data.users.map((u: any) => ({
          address: u.address,
          name: u.name,
          status: u.status || "LOADING",
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
            
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <FriendList 
          friends={filteredFriends}
          onUnfriend={handleUnfriend}
        />
      </div>
    </div>
  );
}
export default FriendsPage;
