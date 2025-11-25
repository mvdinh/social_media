import { Check, X, UserPlus, Users } from "lucide-react";
import { Friend } from "./FriendPage";

interface FriendCardProps {
  friend: Friend;
  onAccept: (address: string) => void;
  onReject: (address: string) => void;
  onSendRequest: (address: string) => void;
}

const FriendCard = ({ friend, onAccept, onReject, onSendRequest }: FriendCardProps) => {
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={friend.avatar}
            alt={friend.address}
            className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100"
          />
          {friend.status === "PENDING_RECEIVED" && (
            <div className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {truncateAddress(friend.address)}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                {friend.address}
              </p>
            </div>
          </div>

          {/* Mutual Friends (if available) */}
          {friend.mutualFriends !== undefined && friend.mutualFriends > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
              <Users className="w-4 h-4" />
              <span>{friend.mutualFriends} bạn chung</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {friend.status === "PENDING_RECEIVED" ? (
              <>
                {/* Accept Button */}
                <button
                  onClick={() => onAccept(friend.address)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Chấp nhận
                </button>
                {/* Reject Button */}
                <button
                  onClick={() => onReject(friend.address)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : friend.status === "NONE" ? (
              <>
                {/* Send Request Button */}
                <button
                  onClick={() => onSendRequest(friend.address)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Kết bạn
                </button>
              </>
            ) : friend.status === "PENDING_SENT" ? (
              <>
                {/* Pending Button */}
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                >
                  Đã gửi lời mời
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;