import { Globe, Plus, Share2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFromIpfs } from '../../../helper/UploadToIpfs';

interface GroupHeaderProps {
  group: {
    id: string;
    name: string;          // CID của name
    description: string;   // CID của description
    groupType: number;     // 0: PUBLIC, 1: PRIVATE
    coverImage: string;    // CID của ảnh
    memberCount: number;
  };
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);

        // Giải mã tên nhóm từ IPFS
        if (group.name) {
          console.log('🔓 Decoding name from CID:', group.name);
          const decodedName = await getFromIpfs(group.name);
          setGroupName(decodedName);
          console.log('✅ Decoded name:', decodedName);
        }

        // Tạo URL ảnh từ CID
        if (group.coverImage) {
          console.log('🖼️ Cover image CID:', group.coverImage);
          const imageUrl = `http://127.0.0.1:8080/ipfs/${group.coverImage}`;
          setCoverImageUrl(imageUrl);
          console.log('✅ Cover image URL:', imageUrl);
        }
      } catch (error) {
        console.error('❌ Error fetching group data from IPFS:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [group.name, group.coverImage]);

  const groupType = group.groupType === 0 ? 'Nhóm công khai' : 'Nhóm riêng tư';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cover */}
      <div className="relative h-64 bg-gray-200">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
          </div>
        ) : coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={groupName}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ Failed to load cover image:', coverImageUrl);
              
              // Thử fallback sang public gateway
              if (coverImageUrl.includes('127.0.0.1')) {
                const publicUrl = coverImageUrl.replace(
                  'http://127.0.0.1:8080/ipfs/',
                  'https://ipfs.io/ipfs/'
                );
                console.log('🔄 Retrying with public gateway:', publicUrl);
                (e.target as HTMLImageElement).src = publicUrl;
              } else {
                // Nếu vẫn lỗi, ẩn ảnh
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }}
          />
        ) : null}

        {/* Fallback gradient khi không có ảnh */}
        {!isLoading && !coverImageUrl && groupName && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-6xl font-bold">
              {groupName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Info + Actions */}
      <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* LEFT: Group Info */}
        <div>
          <h1 className="text-2xl font-semibold">
            {isLoading ? 'Đang tải...' : groupName}
          </h1>

          <div className="flex items-center gap-2 text-gray-600 mt-2">
            <Globe className="w-4 h-4" />
            <span>{groupType}</span>
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