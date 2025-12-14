export const getTimeAgo = (timestamp: any): string => {
  const createdAt = new Date(timestamp);
  const now = new Date();

  // ===== 1. So sánh theo NGÀY (local time) =====
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const startOfCreatedDay = new Date(
    createdAt.getFullYear(),
    createdAt.getMonth(),
    createdAt.getDate()
  );

  const dayDiff = Math.floor(
    (startOfToday.getTime() - startOfCreatedDay.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // ===== 2. Nếu khác ngày =====
  if (dayDiff >= 1) {
    if (dayDiff === 1) return "Hôm qua";
    if (dayDiff < 7) return `${dayDiff} ngày trước`;
    return createdAt.toLocaleDateString("vi-VN");
  }

  // ===== 3. Cùng ngày → tính giờ/phút =====
  const diffSec = Math.floor(
    (now.getTime() - createdAt.getTime()) / 1000
  );

  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  return `${Math.floor(diffSec / 3600)} giờ trước`;
};
