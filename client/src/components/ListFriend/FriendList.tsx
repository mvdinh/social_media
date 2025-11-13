import { Friend } from "../../types/friend";
import { FriendCard } from "./FriendCard";



interface FriendListProps {
  friends: Friend[];
  onAddFriend: (address: string) => void;
  onCancelFriend: (address: string) => void;
}

export function FriendList({ friends, onAddFriend, onCancelFriend }: FriendListProps) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Chưa có bạn bè nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {friends.map(friend => (
        <FriendCard
          key={friend.address}
          friend={friend}
          onAddFriend={onAddFriend}
          onCancelFriend={onCancelFriend}
        />
      ))}
    </div>
  );
}
