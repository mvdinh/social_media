import { ethers } from 'ethers';
import { Post } from '../db/mongodb.js';
import { getFromIPFS } from './ipfs.js';

const ABI = [
  "event PostCreated(uint256 indexed postId, address indexed author, string contentCID, uint256 timestamp)",
  "event PostLiked(uint256 indexed postId, address indexed liker, bool liked)",
  "event PostCommented(uint256 indexed postId, address indexed commenter, string commentCID, uint256 timestamp)",
  "event PostShared(uint256 indexed postId, address indexed sharer, uint256 newPostId, uint256 timestamp)"
];

let contract;

export const startEventListener = async () => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

    // Listen to PostCreated
    contract.on('PostCreated', async (postId, author, contentCID, timestamp) => {
      console.log(`📝 New post: ${postId}`);
      try {
        const content = await getFromIPFS(contentCID);
        await Post.create({
          postId: Number(postId),
          author,
          contentCID,
          timestamp: Number(timestamp),
          content,
          likeCount: 0,
          commentCount: 0,
          shareCount: 0,
          likes: [],
          comments: [],
          shares: []
        });
      } catch (error) {
        console.error('Error processing PostCreated:', error);
      }
    });

    // Listen to PostLiked
    contract.on('PostLiked', async (postId, liker, liked) => {
      console.log(`${liked ? '👍' : '👎'} Post ${postId} by ${liker}`);
      try {
        const post = await Post.findOne({ postId: Number(postId) });
        if (!post) return;

        if (liked) {
          post.likeCount++;
          post.likes.push({ address: liker, timestamp: Date.now() });
        } else {
          post.likeCount = Math.max(0, post.likeCount - 1);
          post.likes = post.likes.filter(l => l.address !== liker);
        }
        await post.save();
      } catch (error) {
        console.error('Error processing PostLiked:', error);
      }
    });

    // Listen to PostCommented
    contract.on('PostCommented', async (postId, commenter, commentCID, timestamp) => {
      console.log(`💬 Comment on post ${postId}`);
      try {
        const content = await getFromIPFS(commentCID);
        const post = await Post.findOne({ postId: Number(postId) });
        if (!post) return;

        post.commentCount++;
        post.comments.push({
          address: commenter,
          commentCID,
          content,
          timestamp: Number(timestamp)
        });
        await post.save();
      } catch (error) {
        console.error('Error processing PostCommented:', error);
      }
    });

    // Listen to PostShared
    contract.on('PostShared', async (postId, sharer, newPostId, timestamp) => {
      console.log(`🔄 Post ${postId} shared as ${newPostId}`);
      try {
        const post = await Post.findOne({ postId: Number(postId) });
        if (!post) return;

        post.shareCount++;
        post.shares.push({
          address: sharer,
          newPostId: Number(newPostId),
          timestamp: Number(timestamp)
        });
        await post.save();
      } catch (error) {
        console.error('Error processing PostShared:', error);
      }
    });

    console.log('✅ Event listener started');
  } catch (error) {
    console.error('Failed to start event listener:', error);
    throw error;
  }
};