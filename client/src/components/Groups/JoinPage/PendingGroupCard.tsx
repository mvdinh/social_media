import { MoreHorizontal } from 'lucide-react';

interface PendingGroup {
  id: number;
  name: string;
  image: string;
  requestedDate: string;
}

interface PendingGroupCardProps {
  group: PendingGroup;
}

export function PendingGroupCard({ group }: PendingGroupCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start gap-4">
        <img
          src={group.image}
          alt={group.name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="mb-1">
            {group.name}
          </h3>
          <p className="text-gray-600">
            Đã yêu cầu tham gia vào {group.requestedDate}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors">
          Xem nhóm
        </button>
        <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
