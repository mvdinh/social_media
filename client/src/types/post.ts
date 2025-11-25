export interface Comment {
  author: string;
  avatar: string;
  content: string;
  contentHash: string;
  mediaHash: string;
  timestamp: number;
  isDeleted: boolean;
}

export interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  contentHash: string;
  mediaHashes: string[];
  mediaType: number;
  image?: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  timestamp: number;
  isDeleted: boolean;
}
