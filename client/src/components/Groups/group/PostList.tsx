import { PostCard } from './PostCard';

export function PostList() {
  const posts = [
    {
      id: 1,
      author: {
        name: 'Ngọc Nguyễn Bích',
        avatar: 'https://i.pravatar.cc/150?img=5',
        timestamp: 'Hôm qua lúc 09:10',
        isPublic: true,
      },
      content: `Tuyển dòng hàng full time lâu dài ở khu đô thị văn phú( gần tháp đống hồ Văn Phú)
- Lương cứng 6,5triu+  phụ cấp chuyên cần, tăng ca x2
- Thời gian làm việc: Từ (12-t7 ( sáng 8h-12h, chiều 13h30- 17h30)
-- Yêu cầu: nhanh nhen, có trách nhiệm, cẩn thận`,
      likes: 2,
      comments: 12,
      shares: 0,
    },
    {
      id: 2,
      author: {
        name: 'San San',
        avatar: 'https://i.pravatar.cc/150?img=8',
        timestamp: '2 giờ trước',
        isPublic: true,
      },
      content: 'Cần tuyển nhân viên bán hàng online, làm việc tại nhà, lương 5-7tr/tháng. Liên hệ: 0123456789',
      likes: 5,
      comments: 8,
      shares: 2,
      images: ['https://images.unsplash.com/photo-1562399093-3321b60a63cf?w=500'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow px-4 py-3">
        <div className="flex items-center gap-2">
          <span>Phù hợp nhất</span>
          <span className="text-gray-400">▼</span>
        </div>
      </div>

      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
