import { Users, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    coverImage: string;
    memberCount: number;
    groupType: number; // 0: Public, 1: Private
    autoApprove: boolean;
    owner: string;
    createdAt: number;
    exists: boolean;
  };
}

export const GroupCard = ({ group }: GroupCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={() => navigate(`/groups/${group.id}`)}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gray-100 relative overflow-hidden">
        <img
          src={group.coverImage}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Group';
          }}
        />
        {/* Badge Privacy */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
          {group.groupType === 1 ? <Lock size={12} /> : <Globe size={12} />}
          {group.groupType === 1 ? 'Riêng tư' : 'Công khai'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">
          {group.name}
        </h3>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">
          {group.description || "Không có mô tả."}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
            <Users size={16} />
            <span className="font-medium">{group.memberCount}</span>
            <span className="text-gray-400">thành viên</span>
          </div>
          
          <button className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
            Truy cập
          </button>
        </div>
      </div>
    </div>
  );
};