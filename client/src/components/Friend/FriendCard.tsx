import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast, Toaster } from "sonner";
import { Loader2, Users, MoreVertical, UserMinus } from "lucide-react";

interface Friend {
  address: string;
  avatar: string;
}

interface FriendCardProps {
  friend: Friend;
  onUnfriend: (address: string) => void;
}

const FriendCard = ({ friend, onUnfriend }: FriendCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleUnfriend = () => {
    setShowMenu(false);
    onUnfriend(friend.address);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 relative">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={friend.avatar}
            alt={friend.address}
            className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-lg">
                {truncateAddress(friend.address)}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                {friend.address}
              </p>
            </div>

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                    <button
                      onClick={handleUnfriend}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                      Hủy kết bạn
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Bạn bè
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FriendCard;