import { MoreHorizontal } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { PendingGroupCard } from './PendingGroupCard';

interface Group {
  id: number;
  name: string;
  image: string;
  lastAccessed: string;
}

interface PendingGroup {
  id: number;
  name: string;
  image: string;
  requestedDate: string;
}

export default function JoinPage() {
  const pendingGroups: PendingGroup[] = [
    {
      id: 1,
      name: 'Dân chơi 7a',
      image: 'https://images.unsplash.com/photo-1759245860566-fd63a7d9c7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBjb21tdW5pdHklMjBpbGx1c3RyYXRpb258ZW58MXx8fHwxNzY0MDY3MzM3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      requestedDate: '8 năm trước',
    },
  ];

  const joinedGroups: Group[] = [
    {
      id: 1,
      name: 'VIỆC LÀM KHO TẠI HÀ NỘI',
      image: 'https://images.unsplash.com/photo-1646215993316-c98f642303ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JrcGxhY2UlMjBvZmZpY2UlMjBoYW5vaXxlbnwxfHx8fDE3NjQwNjczMzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      lastAccessed: '6 giờ trước',
    },
    {
      id: 2,
      name: 'Chợ Thanh Lý Đồ Sinh Viên - HÀ NỘI',
      image: 'https://images.unsplash.com/photo-1501244088470-7c1da5b664f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXdzcGFwZXIlMjB2aWV0bmFtfGVufDF8fHx8MTc2NDA2NzMzN3ww&ixlib=rb-4.1.0&q=80&w=1080',
      lastAccessed: '38 tuần trước',
    },
    {
      id: 3,
      name: 'Pass đồ sinh viên giá rẻ Hà Nội',
      image: 'https://images.unsplash.com/photo-1486304873000-235643847519?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwaG91c2luZ3xlbnwxfHx8fDE3NjM5ODM2MTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      lastAccessed: '12 tuần trước',
    },
    {
      id: 4,
      name: 'Lập trình Web _ K63',
      image: 'https://images.unsplash.com/photo-1624225322963-a453470735c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ24lMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2Mzk3MTkwOXww&ixlib=rb-4.1.0&q=80&w=1080',
      lastAccessed: '5 tuần trước',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Pending Groups Section */}
        <div className="mb-8">
          <h2 className="mb-2">
            Yêu cầu tham gia nhóm đang chờ ({pendingGroups.length})
          </h2>
          <p className="text-gray-600 mb-4">
            Xem các nhóm và kênh bảng feed mà bạn đã yêu cầu tham gia. Có thể bạn sẽ phải trả lời
            câu hỏi thì mới có nhóm mới phê duyệt yêu cầu tham gia của bạn.
          </p>
          
          <div className="space-y-4">
            {pendingGroups.map((group) => (
              <PendingGroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>

        {/* Joined Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2>
              Tất cả các nhóm bạn đã tham gia (17)
            </h2>
            <button className="text-blue-600 hover:underline">
              Sắp xếp
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
