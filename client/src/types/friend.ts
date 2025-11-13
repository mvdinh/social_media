export interface User {
  id: string;
  name: string;
  avatar: string;
  mutualFriends?: number;
}

export interface FriendRequest {
  id: string;
  user: User;
  timestamp: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  mutualFriends?: number;
  status: "NONE" | "PENDING" | "ACCEPTED" | "LOADING" | "ERROR";
}
