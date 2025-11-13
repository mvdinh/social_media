import { Friend } from "../../types/friend";


interface FriendCardProps {
  friend: Friend;
  onAddFriend: (address: string) => void;
  onCancelFriend: (address: string) => void;
}

export function FriendCard({ friend, onAddFriend, onCancelFriend }: FriendCardProps) {
  const handleClick = () => {
    if (friend.status === "NONE") {
      onAddFriend(friend.address);
    } else {
      onCancelFriend(friend.address);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <img
          src={friend.avatar}
          alt={friend.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{friend.name}</h3>
          {friend.mutualFriends && friend.mutualFriends > 0 && (
            <p className="text-gray-500 text-sm">{friend.mutualFriends} bạn chung</p>
          )}
        </div>
        <button
          className={`px-4 py-2 rounded-3xl text-white ${
            friend.status === "NONE"
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
          onClick={handleClick}
        >
          {friend.status === "NONE" ? "Kết bạn" : "Hủy"}
        </button>
      </div>
    </div>
  );
}
