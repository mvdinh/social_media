interface Post {
  postId: number;        
  user: string;              
  contentHash: string;         
  mediaHashes?: string[];      
  mediaType: 0 | 1 | 2 | 3;   
  likes: number;               
  shares: number;             
  comments: number;            
}

interface Like {
  _id: string;
  postId: number;
  user: string;
  txHash: string;
  timestamp: string;
}