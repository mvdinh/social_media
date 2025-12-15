// Định nghĩa Enum khớp với logic hiển thị của Frontend
export enum MediaType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  MIXED = 3
}

export interface Comment {
  id: string;
  author: string; // Address
  authorName: string;
  avatar: string;
  content: string;
  timestamp: number;
  time: string;
}

export interface Post {
  id: string;
  author: string;     // Address
  authorName: string; // Username hiển thị
  avatar: string;     // URL Avatar
  avatarIpfsHash?: string; // IPFS Hash mã cid ảnh đại diện
  
  content: string;
  mediaHashes: string[]; // Frontend cũ dùng tên này, ta giữ nguyên nhưng map data là URL
  image: string | null;  // URL ảnh đầu tiên để hiển thị cover
  mediaType: MediaType;  // Enum number (0, 1, 2, 3)
  
  likes: number;      // Số lượng like
  isLiked: boolean;   // Trạng thái like của user hiện tại
  commentsCount: number;
  comments: Comment[];
  
  timestamp: number;
  time: string;
  isDeleted: boolean;
}