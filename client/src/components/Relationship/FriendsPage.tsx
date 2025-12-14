import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";
import FriendCard from "./FriendCard";
import { Loader2, Users, UserPlus, RefreshCw } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { useSocket } from "../../context/SocketContext";

export interface Friend {
  _id?: string;
  address: string;
  username?: string;
  avatar: string;
  bio?: string;
  status: "NONE" | "PENDING_RECEIVED" | "PENDING_SENT" | "ACCEPTED";
  mutualFriends?: number;
}

const FriendsPage = () => {
  const { address } = useAuth();
  const { socket } = useSocket();

  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<"requests" | "suggestions">("requests");

  // =========================================================
  // LOAD DATA (API)
  // =========================================================
  const loadData = useCallback(
    async (isBackgroundRefresh = false) => {
      if (!address) return;
      if (!isBackgroundRefresh) setLoading(true);

      try {
        const [pendingRes, suggestedRes] = await Promise.all([
          axiosClient.get<Friend[]>("/relationships/pending"),
          axiosClient.get<Friend[]>("/relationships/suggestions"),
        ]);

        setPendingRequests(pendingRes.data);
        setSuggestedUsers(suggestedRes.data);
      } catch (error) {
        console.error(error);
        if (!isBackgroundRefresh) {
          toast.error("Không thể tải dữ liệu");
        }
      } finally {
        setLoading(false);
      }
    },
    [address]
  );

  // Load lần đầu
  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================================
  // 🔥 SOCKET REALTIME – UPDATE STATE TRỰC TIẾP
  // =========================================================
  useEffect(() => {
    if (!socket) return;

    // ===== NEW FRIEND REQUEST =====
    const handleNewFriendRequest = (data: Friend) => {
      console.log("🔥 Realtime new_friend_request:", data);

      toast.info(
        `🔔 ${data.username || "Một người"} gửi lời mời kết bạn`,
        {
          duration: 4000,
          action: {
            label: "Xem",
            onClick: () => setActiveTab("requests"),
          },
        }
      );

      // Thêm ngay vào pendingRequests (không trùng)
      setPendingRequests((prev) => {
        const exists = prev.some(
          (u) => u.address === data.address
        );
        if (exists) return prev;
        return [data, ...prev];
      });

      // Gỡ khỏi suggestedUsers nếu có
      setSuggestedUsers((prev) =>
        prev.filter((u) => u.address !== data.address)
      );
    };

    socket.on("new_friend_request", handleNewFriendRequest);

    return () => {
      socket.off("new_friend_request", handleNewFriendRequest);
    };
  }, [socket]);

  // =========================================================
  // ACTIONS
  // =========================================================

  const handleSendRequest = async (friendAddress: string) => {
    try {
      // Optimistic UI
      setSuggestedUsers((prev) =>
        prev.filter((u) => u.address !== friendAddress)
      );
      toast.success("Đã gửi lời mời kết bạn!");

      await axiosClient.post("/relationships/request", {
        targetAddress: friendAddress,
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi gửi lời mời"
      );
      loadData(true); // rollback
    }
  };

  const handleAcceptRequest = async (friendAddress: string) => {
    try {
      setPendingRequests((prev) =>
        prev.filter((u) => u.address !== friendAddress)
      );
      toast.success("Đã chấp nhận lời mời!");

      await axiosClient.post("/relationships/accept", {
        targetAddress: friendAddress,
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi chấp nhận"
      );
      loadData(true);
    }
  };

  const handleRejectRequest = async (friendAddress: string) => {
    try {
      setPendingRequests((prev) =>
        prev.filter((u) => u.address !== friendAddress)
      );
      toast.success("Đã từ chối lời mời!");

      await axiosClient.post("/relationships/reject", {
        targetAddress: friendAddress,
      });

      loadData(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Lỗi từ chối"
      );
      loadData(true);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  if (
    loading &&
    pendingRequests.length === 0 &&
    suggestedUsers.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" richColors />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kết bạn
            </h1>
            <p className="text-gray-600">
              Quản lý lời mời kết bạn và tìm bạn mới
            </p>
          </div>
          <button
            onClick={() => loadData(false)}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full"
          >
            <RefreshCw
              className={`w-5 h-5 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 px-6 py-4 font-medium flex justify-center gap-2 ${
                activeTab === "requests"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600"
              }`}
            >
              <Users className="w-5 h-5" />
              Lời mời
              {pendingRequests.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("suggestions")}
              className={`flex-1 px-6 py-4 font-medium flex justify-center gap-2 ${
                activeTab === "suggestions"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Gợi ý
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "requests" ? (
          pendingRequests.length === 0 ? (
            <EmptyState
              icon={<Users className="w-16 h-16 text-gray-300" />}
              text="Không có lời mời kết bạn"
            />
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
          )
        ) : suggestedUsers.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="w-16 h-16 text-gray-300" />}
            text="Không có gợi ý kết bạn"
          />
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
    </div>
  );
};

const EmptyState = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
    <div className="mx-auto mb-4">{icon}</div>
    <p className="text-gray-500">{text}</p>
  </div>
);

export default FriendsPage;
