import { Globe, Eye, MapPin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFromIpfs } from '../../../helper/UploadToIpfs';

interface GroupSidebarProps {
  group: {
    description: string;  // CID của description
    groupType: number;    // 0: PUBLIC, 1: PRIVATE
  };
}

export function GroupSidebar({ group }: GroupSidebarProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDescription = async () => {
      try {
        setIsLoading(true);

        // Giải mã description từ IPFS
        if (group.description) {
          console.log('🔓 Decoding description from CID:', group.description);
          const decodedDesc = await getFromIpfs(group.description);
          setDescription(decodedDesc);
          console.log('✅ Decoded description:', decodedDesc);
        }
      } catch (error) {
        console.error('❌ Error fetching description from IPFS:', error);
        setDescription('Không thể tải mô tả');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDescription();
  }, [group.description]);

  const isPublic = group.groupType === 0;

  return (
    <div className="space-y-4">
      {/* Giới thiệu */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="mb-3 font-semibold">Giới thiệu</h3>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Đang tải mô tả...</span>
          </div>
        ) : (
          <>
            <p className="text-gray-700 text-sm mb-3">
              {description || 'Không có mô tả'}
            </p>
            {description && description.length > 150 && (
              <button className="text-blue-600 hover:underline text-sm">
                Xem thêm
              </button>
            )}
          </>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                {isPublic ? 'Công khai' : 'Riêng tư'}
              </p>
              <p className="text-xs text-gray-500">
                {isPublic 
                  ? 'Bất kỳ ai cũng có thể nhìn thấy nhóm này.'
                  : 'Chỉ thành viên mới có thể nhìn thấy nội dung nhóm.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Hiển thị</p>
              <p className="text-xs text-gray-500">
                {isPublic
                  ? 'Ai cũng có thể tìm thấy nhóm này.'
                  : 'Chỉ thành viên mới thấy nhóm này.'
                }
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
    </div>
  );
}