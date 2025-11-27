import { Globe, Eye, MapPin, ChevronRight } from 'lucide-react';


interface GroupSidebarProps {
  group: {
    description: string;
  };
}

export function GroupSidebar({ group }: GroupSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Giới thiệu */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="mb-3">Giới thiệu</h3>
        <p className="text-gray-700 text-sm mb-3">
          {group.description}
        </p>
        <button className="text-blue-600 hover:underline text-sm">
          Xem thêm
        </button>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Công khai</p>
              <p className="text-xs text-gray-500">
                Bất kỳ ai cũng có thể nhìn thấy nhóm này.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Hiển thị</p>
              <p className="text-xs text-gray-500">
                AI cũng có thể tìm thấy nhóm này.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Phương An Phú · Tỉnh Đắk Lắk · Quận 11 · Tỉnh Gia Lai...</p>
              <button className="text-blue-600 hover:underline text-xs">
                xem thêm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File phương tiện mới đây */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3>File phương tiện mới đây</h3>
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <img
            src='https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop'
            alt="Media 1"
            className="w-full aspect-square object-cover rounded-lg"
          />
          <img
            src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
            alt="Media 2"
            className="w-full aspect-square object-cover rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
