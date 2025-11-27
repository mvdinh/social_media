import { Globe, Plus, Share2, Check, ChevronDown } from 'lucide-react';

interface GroupHeaderProps {
  group: {
    name: string;
    coverImage: string;
    type: string;
    memberCount: string;
  };
}

export function GroupHeader({ group }: GroupHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cover */}
      <div className="relative h-64 bg-gray-200">
        <img
          src={group.coverImage}
          alt={group.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info + Actions */}
      <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* LEFT: Group Info */}
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>

          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Globe className="w-4 h-4" />
            <span>{group.type}</span>
            <span>·</span>
            <span>{group.memberCount} thành viên</span>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Mời</span>
          </button>

          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-300 transition-colors">
            <Share2 className="w-4 h-4" />
            <span>Chia sẻ</span>
          </button>

          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-300 transition-colors">
            <Check className="w-4 h-4" />
            <span>Đã tham gia</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
