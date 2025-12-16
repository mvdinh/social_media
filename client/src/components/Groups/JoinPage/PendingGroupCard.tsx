import { MoreHorizontal } from 'lucide-react';
import { PendingGroup } from '../types/group';

export function PendingGroupCard({ group }: { group: PendingGroup }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <img
          src={group.image}
          alt={group.name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-gray-200"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {group.name}
          </h3>
          <p className="text-gray-600 text-sm">
            Đã yêu cầu tham gia vào {group.requestedDate}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm">
          Xem nhóm
        </button>
        <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}