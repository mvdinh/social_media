import { FriendRequest, Friend } from "../../types/friend";

export const mockFriendRequests: FriendRequest[] = [
  {
    id: "1",
    user: {
      id: "u1",
      name: "Nguyễn Minh Anh",
      avatar: "https://images.unsplash.com/photo-1595436222774-4b1cd819aada?w=200&h=200&fit=crop",
      mutualFriends: 12
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: "2",
    user: {
      id: "u2",
      name: "Trần Thị Hương",
      avatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?w=200&h=200&fit=crop",
      mutualFriends: 5
    },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() // 5 hours ago
  },
  {
    id: "3",
    user: {
      id: "u3",
      name: "Phạm Văn Tuấn",
      avatar: "https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?w=200&h=200&fit=crop",
      mutualFriends: 8
    },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: "4",
    user: {
      id: "u4",
      name: "Lê Thị Mai",
      avatar: "https://images.unsplash.com/photo-1510947565940-a38e2443c426?w=200&h=200&fit=crop",
      mutualFriends: 3
    },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: "5",
    user: {
      id: "u5",
      name: "Hoàng Minh Quân",
      avatar: "https://images.unsplash.com/photo-1628210726948-4979adb3d9d0?w=200&h=200&fit=crop",
      mutualFriends: 15
    },
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: "6",
    user: {
      id: "u6",
      name: "Đỗ Thị Lan",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      mutualFriends: 7
    },
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
  }
];

export const mockFriends: Friend[] = [
  {
    id: "f1",
    name: "Nguyễn Nhật Lệ",
    avatar: "https://images.unsplash.com/photo-1526876917250-9c7bcecd349f?w=200&h=200&fit=crop",
    mutualFriends: 3
  },
  {
    id: "f2",
    name: "Thùy Mai",
    avatar: "https://images.unsplash.com/photo-1490088715170-e367d03a58f7?w=200&h=200&fit=crop",
    mutualFriends: 29
  },
  {
    id: "f3",
    name: "Trần Văn Hùng",
    avatar: "https://images.unsplash.com/photo-1734864489622-0406baee014f?w=200&h=200&fit=crop",
    mutualFriends: 15
  },
  {
    id: "f4",
    name: "Lê Thu Hà",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    mutualFriends: 8
  },
  {
    id: "f5",
    name: "Phạm Minh Tuấn",
    avatar: "https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?w=200&h=200&fit=crop",
    mutualFriends: 12
  },
  {
    id: "f6",
    name: "Đặng Thị Lan",
    avatar: "https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?w=200&h=200&fit=crop",
    mutualFriends: 6
  }
];
