import { ethers } from 'ethers';
import contractABI from '../contracts/SocialMedia.json';

class ContractService {
  constructor() {
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI.abi,
      this.signer
    );

    console.log('✅ Contract initialized:', this.contractAddress);
  }

  async createPost(ipfsHash) {
    try {
      if (!this.contract) await this.initialize();

      console.log('📝 Creating post with IPFS hash:', ipfsHash);
      const tx = await this.contract.createPost(ipfsHash);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      // Get postId from event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log).name === 'PostCreated';
        } catch {
          return false;
        }
      });

      const postId = event ? this.contract.interface.parseLog(event).args.postId : null;

      return {
        success: true,
        transactionHash: receipt.hash,
        postId: postId ? postId.toString() : null
      };
    } catch (error) {
      console.error('❌ Create post error:', error);
      throw error;
    }
  }

  async likePost(postId) {
    try {
      if (!this.contract) await this.initialize();

      console.log('❤️ Liking post:', postId);
      const tx = await this.contract.likePost(postId);
      console.log('⏳ Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('❌ Like post error:', error);
      throw error;
    }
  }

  async unlikePost(postId) {
    try {
      if (!this.contract) await this.initialize();

      console.log('💔 Unliking post:', postId);
      const tx = await this.contract.unlikePost(postId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('❌ Unlike post error:', error);
      throw error;
    }
  }

  async addComment(postId, content) {
    try {
      if (!this.contract) await this.initialize();

      console.log('💬 Adding comment to post:', postId);
      const tx = await this.contract.addComment(postId, content);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log).name === 'CommentAdded';
        } catch {
          return false;
        }
      });

      const commentId = event ? this.contract.interface.parseLog(event).args.commentId : null;

      return {
        success: true,
        transactionHash: receipt.hash,
        commentId: commentId ? commentId.toString() : null
      };
    } catch (error) {
      console.error('❌ Add comment error:', error);
      throw error;
    }
  }

  async getAllPosts() {
    try {
      if (!this.contract) await this.initialize();

      console.log('📖 Fetching all posts...');
      const posts = await this.contract.getAllPosts();

      return posts.map(post => ({
        id: post.id.toString(),
        author: post.author,
        ipfsHash: post.ipfsHash,
        timestamp: new Date(Number(post.timestamp) * 1000),
        likesCount: Number(post.likesCount),
        commentsCount: Number(post.commentsCount),
        isActive: post.isActive
      }));
    } catch (error) {
      console.error('❌ Get posts error:', error);
      throw error;
    }
  }

  async getPost(postId) {
    try {
      if (!this.contract) await this.initialize();

      const post = await this.contract.getPost(postId);
      
      return {
        id: post.id.toString(),
        author: post.author,
        ipfsHash: post.ipfsHash,
        timestamp: new Date(Number(post.timestamp) * 1000),
        likesCount: Number(post.likesCount),
        commentsCount: Number(post.commentsCount),
        isActive: post.isActive
      };
    } catch (error) {
      console.error('❌ Get post error:', error);
      throw error;
    }
  }

  async getPostComments(postId) {
    try {
      if (!this.contract) await this.initialize();

      const comments = await this.contract.getPostComments(postId);
      
      return comments.map(comment => ({
        id: comment.id.toString(),
        postId: comment.postId.toString(),
        author: comment.author,
        content: comment.content,
        timestamp: new Date(Number(comment.timestamp) * 1000),
        isActive: comment.isActive
      }));
    } catch (error) {
      console.error('❌ Get comments error:', error);
      throw error;
    }
  }

  async hasLiked(postId, userAddress) {
    try {
      if (!this.contract) await this.initialize();

      return await this.contract.hasLiked(postId, userAddress);
    } catch (error) {
      console.error('❌ Check like error:', error);
      return false;
    }
  }

  async getUserPosts(userAddress) {
    try {
      if (!this.contract) await this.initialize();

      const postIds = await this.contract.getUserPosts(userAddress);
      return postIds.map(id => id.toString());
    } catch (error) {
      console.error('❌ Get user posts error:', error);
      throw error;
    }
  }
}

export default new ContractService();
