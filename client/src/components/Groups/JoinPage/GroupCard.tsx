import { MoreHorizontal } from 'lucide-react';

interface Group {
  id: number;
  name: string;
  image: string;
  lastAccessed: string;
}

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <img
        src={group.image}
        alt={group.name}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h3 className="mb-2">
          {group.name}
        </h3>
        <p className="text-gray-600 mb-4">
          Lần truy cập gần đây nhất: <br />
          {group.lastAccessed}
        </p>
        
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors">
            Xem nhóm
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
