interface Post {
  id: number;
  author: string;
  contentHash: string;
  mediaHashes: string[];
  mediaType: number;
  timestamp: number;
  likes: number;
  shares: number;
  content?: string;
  mediaUrls?: string[];
  isNFT: boolean;
}

enum MediaType {
  TEXT = 0,
  IMAGE = 1,
  VIDEO = 2,
  MIXED = 3
}