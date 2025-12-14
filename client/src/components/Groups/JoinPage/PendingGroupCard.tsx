import { Lock, Clock } from 'lucide-react';

interface PendingGroupProps {
  group: {
    id: string;
    name: string;
    description: string;
    avatarUrl: string;
    memberCount: number;
    privacy: 'PUBLIC' | 'PRIVATE';
  };
}

export const PendingGroupCard = ({ group }: PendingGroupProps) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
      {/* Avatar Nhóm */}
      <img
        src={group.avatarUrl}
        alt={group.name}
        className="w-16 h-16 rounded-xl object-cover bg-gray-100 border border-gray-100 flex-shrink-0"
      />

      {/* Thông tin */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-lg truncate">
          {group.name}
        </h3>
        
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
          {group.privacy === 'PRIVATE' && (
            <span className="flex items-center gap-1">
              <Lock size={14} /> Riêng tư
            </span>
          )}
          <span>•</span>
          <span>{group.memberCount} thành viên</span>
        </div>
      </div>

      {/* Trạng thái / Action */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-full border border-yellow-100">
          <Clock size={14} />
          <span>Đang chờ duyệt</span>
        </div>
        
        <button 
          onClick={() => {
             // Logic hủy yêu cầu nếu cần (call API delete request)
             console.log("Cancel request for group", group.id);
          }}
          className="text-sm text-gray-400 hover:text-red-500 hover:underline transition-colors"
        >
          Hủy yêu cầu
        </button>
      </div>
    </div>
  );
};