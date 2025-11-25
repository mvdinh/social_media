import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";
import { Loader2, Users, MoreVertical, UserMinus } from "lucide-react";
import FriendCard from "./FriendCard";

const FriendsListPage = () => {
  const { address, contracts } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const relationshipContract = contracts["relationship"];

  const getAvatar = (addr: string) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${addr}`;
  };

  const fetchFriends = async () => {
    if (!relationshipContract || !address) return;

    try {
      const friendAddresses = await relationshipContract.getAllFriends(address);
      console.log("Friends:", friendAddresses);

      const mapped: Friend[] = friendAddresses.map((addr: string) => ({
        address: addr,
        avatar: getAvatar(addr),
      }));

      setFriends(mapped);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Không thể tải danh sách bạn bè");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchFriends();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (relationshipContract && address) {
      loadData();
    }
  }, [relationshipContract, address]);

  const handleUnfriend = async (friendAddress: string) => {
    if (!relationshipContract || !address) {
      toast.error("Vui lòng kết nối ví!");
      return;
    }

    try {
      toast.loading("Đang hủy kết bạn...", { id: "unfriend-toast" });

      const tx = await relationshipContract.unfriend(friendAddress);
      await tx.wait();

      toast.success("Hủy kết bạn thành công!", { id: "unfriend-toast" });

      // Update UI: remove from friends list
      setFriends((prev) => prev.filter((f) => f.address !== friendAddress));
    } catch (error: any) {
      console.error("Error unfriending:", error);
      if (error.code === 4001) {
        toast.error("Bạn đã từ chối giao dịch", { id: "unfriend-toast" });
      } else {
        toast.error("Từ chối hủy kết bạn", { id: "unfriend-toast" });
      }
    }
  };

  // Listen to events
  useEffect(() => {
    if (!relationshipContract || !address) return;

    const handleUnfriended = (from: string, to: string) => {
      console.log("Unfriended event:", from, to);
      if (
        from.toLowerCase() === address.toLowerCase() ||
        to.toLowerCase() === address.toLowerCase()
      ) {
        loadData();
      }
    };

    const handleRequestAccepted = (from: string, to: string) => {
      console.log("FriendRequestAccepted event:", from, to);
      if (
        from.toLowerCase() === address.toLowerCase() ||
        to.toLowerCase() === address.toLowerCase()
      ) {
        loadData();
      }
    };

    relationshipContract.on("Unfriended", handleUnfriended);
    relationshipContract.on("FriendRequestAccepted", handleRequestAccepted);

    return () => {
      relationshipContract.off("Unfriended", handleUnfriended);
      relationshipContract.off("FriendRequestAccepted", handleRequestAccepted);
    };
  }, [relationshipContract, address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách bạn bè...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bạn bè</h1>
          <p className="text-gray-600">
            Bạn có {friends.length} người bạn
          </p>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Bạn chưa có bạn bè nào</p>
            <p className="text-sm text-gray-400">
              Hãy thêm bạn bè để kết nối và chia sẻ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <FriendCard
                key={friend.address}
                friend={friend}
                onUnfriend={handleUnfriend}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsListPage;
