import { Friend } from "../../types/friend";
import { UnfriendButton } from "./UnfriendButton";

interface FriendCardProps {
  friend: Friend;
  onUnfriend: (id: string) => void;
}

export function FriendCard({ friend, onUnfriend }: FriendCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-4">
        <img 
          src={friend.avatar} 
          alt={friend.name}
          className="w-20 h-20 rounded-lg object-coveAr"
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{friend.name}</h3>
          {friend.mutualFriends && friend.mutualFriends > 0 && (
            <p className="text-gray-500 text-sm">
              {friend.mutualFriends} bạn chung
            </p>
          )}
        </div>

        <UnfriendButton 
          friendName={friend.name}
          onUnfriend={() => onUnfriend(friend.id)}
        />
      </div>
    </div>
  );
}
