import { useState, useEffect } from 'react';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFromIpfs } from '../../../helper/UploadToIpfs';
import { Group } from '../types/group';

export function GroupCard({ group }: { group: Group }) {
  const navigate = useNavigate();
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        // Lấy name từ IPFS
        console.log('🔓 Decoding name from CID:', group.name);
        const fetchedName = await getFromIpfs(group.name);
        setName(fetchedName);
        console.log('✅ Name:', fetchedName);

        // Lấy description từ IPFS
        console.log('🔓 Decoding description from CID:', group.description);
        const fetchedDesc = await getFromIpfs(group.description);
        setDescription(fetchedDesc);
        console.log('✅ Description:', fetchedDesc);

        // Tạo URL ảnh từ CID
        if (group.coverImage) {
          console.log('🖼️ Cover image CID:', group.coverImage);
          const localUrl = `http://127.0.0.1:8080/ipfs/${group.coverImage}`;
          
          try {
            const response = await fetch(localUrl, { method: 'HEAD' });
            if (response.ok) {
              console.log('✅ Using local IPFS gateway');
              setCoverImageUrl(localUrl);
            } else {
              throw new Error('Local gateway not available');
            }
          } catch {
            console.log('⚠️ Local gateway failed, using public gateway');
            const publicUrl = `https://ipfs.io/ipfs/${group.coverImage}`;
            setCoverImageUrl(publicUrl);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching IPFS data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [group]);

  const formatLastAccessed = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const handleViewGroup = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div className="relative w-full h-40 bg-gray-200">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ Failed to load image:', coverImageUrl);
              
              if (coverImageUrl.includes('127.0.0.1')) {
                const publicUrl = coverImageUrl.replace(
                  'http://127.0.0.1:8080/ipfs/',
                  'https://ipfs.io/ipfs/'
                );
                console.log('🔄 Retrying with public gateway:', publicUrl);
                (e.target as HTMLImageElement).src = publicUrl;
              } else {
                (e.target as HTMLImageElement).style.display = 'none';
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold mb-2 text-gray-900 line-clamp-1">
          {name || 'Đang tải...'}
        </h3>
        <p className="text-gray-600 mb-2 text-sm line-clamp-2">
          {description || 'Không có mô tả'}
        </p>
        <p className="text-gray-500 text-xs mb-4">
          Lần truy cập gần đây nhất: <br />
          {formatLastAccessed(group.createdAt)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleViewGroup}
            className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            Xem nhóm
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}