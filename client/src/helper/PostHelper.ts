
import { getFromIpfs } from "../services/ipfs.service";
import { convertProxyToArray } from "../utils/convertData";

export const refreshCurrentPostComments = async (contract: any, postId: number) => {
  if (!contract) return [];

  const rawComments = await contract.getComments(postId);
  const comments = convertProxyToArray(rawComments);

  const parsedComments: any[] = [];

  for (let i = 0; i < comments.length; i++) {
    const rawComment = comments[i];
    const comment = {
      author: rawComment.author || rawComment[0],
      contentHash: rawComment.contentHash || rawComment[1],
      mediaHash: rawComment.mediaHash || rawComment[2],
      timestamp: rawComment.timestamp || rawComment[3],
      isDeleted: rawComment.isDeleted !== undefined ? rawComment.isDeleted : rawComment[4]
    };

    if (!comment.isDeleted && comment.contentHash) {
      try {
        const content = await getFromIpfs(comment.contentHash);
        parsedComments.push({ ...comment, content });
      } catch {
        parsedComments.push({ ...comment, content: "Không thể tải nội dung bình luận" });
      }
    }
  }

  return parsedComments;
};
