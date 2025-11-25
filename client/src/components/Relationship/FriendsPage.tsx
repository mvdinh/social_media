  import { useState, useEffect } from "react";
  import { useAuth } from "../../context/AuthContext";
  import { toast, Toaster } from "sonner";
  import FriendCard from "./FriendCard";
  import { Loader2, Users, UserPlus } from "lucide-react";

  export interface Friend {
    address: string;
    avatar: string;
    mutualFriends?: number;
    status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";
  }

  const FriendsPage = () => {
    const { address, contracts } = useAuth();
    const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"requests" | "suggestions">("requests");

    const relationshipContract = contracts["relationship"];
    const accContract = contracts["acc"];

    // Generate avatar từ address
    const getAvatar = (addr: string) => {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${addr}`;
    };

    // Fetch pending requests (lời mời đã nhận)
    const fetchPendingRequests = async () => {
      if (!relationshipContract || !address) return;

      try {
        const requests = await relationshipContract.getPendingRequests(address);
        console.log("Pending requests:", requests);

        const mapped: Friend[] = requests.map((addr: string) => ({
          address: addr,
          avatar: getAvatar(addr),
          status: "PENDING_RECEIVED" as const,
          mutualFriends: 0,
        }));

        setPendingRequests(mapped);
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };

    // Fetch suggested users (tất cả user trừ bản thân và bạn bè)
    const fetchSuggestedUsers = async () => {
      if (!relationshipContract || !address) return;

      try {
        // Lấy tất cả users
        const allUsers = await accContract.getAllUsers();
        console.log("All users:", allUsers);

        // Lấy danh sách bạn bè hiện tại
        const friends = await relationshipContract.getAllFriends(address);
        console.log("Current friends:", friends);

        // Lấy danh sách pending sent
        const sentRequests = await relationshipContract.getSentRequests(address);
        console.log("Sent requests:", sentRequests);

        // Lấy danh sách pending received
        const receivedRequests = await relationshipContract.getPendingRequests(address);
        console.log("Received requests:", receivedRequests);

        // Filter: loại bỏ bản thân, bạn bè, và pending
        const suggested = allUsers.filter((user: string) => {
          const userLower = user.toLowerCase();
          const addressLower = address.toLowerCase();
          
          if (userLower === addressLower) return false;
          if (friends.some((f: string) => f.toLowerCase() === userLower)) return false;
          if (sentRequests.some((s: string) => s.toLowerCase() === userLower)) return false;
          if (receivedRequests.some((r: string) => r.toLowerCase() === userLower)) return false;
          
          return true;
        });

        console.log("Suggested users:", suggested);

        // Map với status
        const mapped: Friend[] = suggested.map((addr: string) => ({
          address: addr,
          avatar: getAvatar(addr),
          status: "NONE" as const,
          mutualFriends: 0,
        }));

        setSuggestedUsers(mapped);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      }
    };

    // Load data
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPendingRequests(),
          fetchSuggestedUsers()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (relationshipContract && address) {
        loadData();
      }
    }, [relationshipContract, address]);

    // Gửi lời mời kết bạn
    const handleSendRequest = async (friendAddress: string) => {
      if (!relationshipContract || !address) {
        toast.error("Vui lòng kết nối ví!");
        return;
      }

      try {
        toast.loading("Đang gửi lời mời...", { id: "friend-toast" });
        
        const tx = await relationshipContract.sendFriendRequest(friendAddress);
        await tx.wait();
        
        toast.success("Đã gửi lời mời kết bạn!", { id: "friend-toast" });

        // Update UI: chuyển từ suggested sang pending sent
        setSuggestedUsers(prev => prev.filter(u => u.address !== friendAddress));

      } catch (error: any) {
        console.error("Error sending friend request:", error);
        if (error.code === 4001) {
          toast.error("Bạn đã từ chối giao dịch", { id: "friend-toast" });
        } else {
          toast.error("Không thể gửi lời mời", { id: "friend-toast" });
        }
      }
    };

    // Chấp nhận lời mời
    const handleAcceptRequest = async (friendAddress: string) => {
      if (!relationshipContract || !address) {
        toast.error("Vui lòng kết nối ví!");
        return;
      }

      try {
        toast.loading("Đang chấp nhận...", { id: "friend-toast" });
        
        const tx = await relationshipContract.acceptFriendRequest(friendAddress);
        await tx.wait();
        
        toast.success("Đã chấp nhận lời mời!", { id: "friend-toast" });

        // Update UI: xóa khỏi pending requests
        setPendingRequests(prev => prev.filter(u => u.address !== friendAddress));

      } catch (error: any) {
        console.error("Error accepting friend request:", error);
        if (error.code === 4001) {
          toast.error("Bạn đã từ chối giao dịch", { id: "friend-toast" });
        } else {
          toast.error("Không thể chấp nhận lời mời", { id: "friend-toast" });
        }
      }
    };

    // Từ chối lời mời
    const handleRejectRequest = async (friendAddress: string) => {
      if (!relationshipContract || !address) {
        toast.error("Vui lòng kết nối ví!");
        return;
      }

      try {
        toast.loading("Đang từ chối...", { id: "friend-toast" });
        
        const tx = await relationshipContract.rejectFriendRequest(friendAddress);
        await tx.wait();
        
        toast.success("Đã từ chối lời mời!", { id: "friend-toast" });

        // Update UI: xóa khỏi pending requests và thêm vào suggested
        setPendingRequests(prev => prev.filter(u => u.address !== friendAddress));
        
        // Thêm lại vào gợi ý
        setSuggestedUsers(prev => [...prev, {
          address: friendAddress,
          avatar: getAvatar(friendAddress),
          status: "NONE" as const,
          mutualFriends: 0,
        }]);

      } catch (error: any) {
        console.error("Error rejecting friend request:", error);
        if (error.code === 4001) {
          toast.error("Bạn đã từ chối giao dịch", { id: "friend-toast" });
        } else {
          toast.error("Bạn đã hủy từ chối lời mời", { id: "friend-toast" });
        }
      }
    };

    // Listen to events
    useEffect(() => {
      if (!relationshipContract || !address) return;

      const handleRequestSent = (from: string, to: string) => {
        console.log("FriendRequestSent event:", from, to);
        if (to.toLowerCase() === address.toLowerCase()) {
          // Nhận lời mời mới
          loadData();
        }
      };

      const handleRequestAccepted = (from: string, to: string) => {
        console.log("FriendRequestAccepted event:", from, to);
        if (from.toLowerCase() === address.toLowerCase() || to.toLowerCase() === address.toLowerCase()) {
          loadData();
        }
      };

      const handleRequestRejected = (from: string, to: string) => {
        console.log("FriendRequestRejected event:", from, to);
        if (from.toLowerCase() === address.toLowerCase() || to.toLowerCase() === address.toLowerCase()) {
          loadData();
        }
      };

      relationshipContract.on("FriendRequestSent", handleRequestSent);
      relationshipContract.on("FriendRequestAccepted", handleRequestAccepted);
      relationshipContract.on("FriendRequestRejected", handleRequestRejected);

      return () => {
        relationshipContract.off("FriendRequestSent", handleRequestSent);
        relationshipContract.off("FriendRequestAccepted", handleRequestAccepted);
        relationshipContract.off("FriendRequestRejected", handleRequestRejected);
      };
    }, [relationshipContract, address]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kết bạn</h1>
            <p className="text-gray-600">Quản lý lời mời kết bạn và tìm bạn mới</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "requests"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-5 h-5" />
                Lời mời kết bạn
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === "suggestions"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <UserPlus className="w-5 h-5" />
                Gợi ý kết bạn
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === "requests" ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Lời mời kết bạn ({pendingRequests.length})
              </h2>
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không có lời mời kết bạn nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((friend) => (
                    <FriendCard
                      key={friend.address}
                      friend={friend}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      onSendRequest={handleSendRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Gợi ý kết bạn ({suggestedUsers.length})
              </h2>
              {suggestedUsers.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Không có gợi ý kết bạn nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedUsers.map((friend) => (
                    <FriendCard
                      key={friend.address}
                      friend={friend}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                      onSendRequest={handleSendRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  export default FriendsPage;