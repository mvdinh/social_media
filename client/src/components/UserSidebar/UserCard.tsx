import { Plus, UserPlus, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
interface User {
  _id: string;
  address: string;
  username?: string;
  avatar?: string;
}

const UserCard: React.FC<{ user: User }> = ({ user }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username } 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
            {(user.username|| 'U')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {user.username || 'Anonymous'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {`@${user.username}` || 'New user'}
        </p>
      </div>

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
          isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};

export default UserCard;