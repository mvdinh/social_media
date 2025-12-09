export const getTimeAgo = (timestamp: any): string => {
  // Convert BigInt → number
  const time = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

  const now = Math.floor(Date.now() / 1000);
  const diff = now - time;

  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;

  return new Date(time * 1000).toLocaleDateString("vi-VN");
};
