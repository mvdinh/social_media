import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth1 } from '../../../context/Context';
import { toast, Toaster } from 'sonner';
import { GroupCard } from './GroupCard';
import { PendingGroupCard } from './PendingGroupCard';
import axiosClient from '../../../api/axiosClient';

// Interface khớp với dữ liệu trả về từ API Backend
interface GroupFromBackend {
  _id: string;
  groupId: number; // Lưu ý: Backend trả về số
  name: string;
  description: string;
  avatar: string; // CID IPFS (Qm...)
  coverImage: string | null;
  privacy: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  owner: string;
  createdAt: string;
}

export default function JoinPage() {
  const { user } = useAuth1();
  const address = user?.address || null;
  const [joinedGroups, setJoinedGroups] = useState<GroupFromBackend[]>([]);
  const [pendingGroups, setPendingGroups] = useState<GroupFromBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Chuyển đổi CID thành URL hiển thị được
  const getIpfsUrl = (cid: string | null) => {
    if (!cid) return "https://via.placeholder.com/300x200?text=No+Image"; 
    return `http://127.0.0.1:8080/ipfs/${cid}`; 
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('📡 Fetching groups data...');

        // Gọi song song 2 API: Nhóm đã tham gia & Nhóm đang chờ duyệt
        const [joinedRes, pendingRes] = await Promise.all([
          axiosClient.get<{ success: boolean; groups: GroupFromBackend[] }>('/groups/me'),
          axiosClient.get<{ success: boolean; groups: GroupFromBackend[] }>('/groups/join-requests')
        ]);

        if (joinedRes.data.success) {
          setJoinedGroups(joinedRes.data.groups);
        }

        if (pendingRes.data.success) {
          setPendingGroups(pendingRes.data.groups);
        }

      } catch (error: any) {
        console.error('❌ Error fetching data:', error);
        // toast.error('Không thể tải dữ liệu nhóm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  // UI: Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // UI: Chưa login
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600 mb-4">Vui lòng kết nối ví để xem nhóm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* === SECTION 1: PENDING REQUESTS (CHỜ DUYỆT) === */}
        {pendingGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2">
              ⏳ Đang chờ duyệt 
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                {pendingGroups.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pendingGroups.map((group) => (
                <PendingGroupCard 
                  key={group._id}
                  group={{
                    id: group.groupId.toString(),
                    name: group.name,
                    description: group.description,
                    avatarUrl: getIpfsUrl(group.avatar), // Dùng avatar cho pending card
                    memberCount: group.memberCount,
                    privacy: group.privacy
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* === SECTION 2: JOINED GROUPS (ĐÃ THAM GIA) === */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Nhóm của bạn ({joinedGroups.length})
            </h2>
          </div>
          
          {joinedGroups.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-gray-200 shadow-sm">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Chưa tham gia nhóm nào</h3>
              <p className="text-gray-500 mt-1">Hãy khám phá các cộng đồng thú vị ngay bây giờ!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {joinedGroups.map((group) => (
                <GroupCard 
                  key={group._id} 
                  group={{
                    id: group.groupId.toString(),
                    name: group.name,
                    description: group.description,
                    // Ưu tiên coverImage, nếu không có thì dùng avatar
                    coverImage: getIpfsUrl(group.avatar), 
                    memberCount: group.memberCount,
                    groupType: group.privacy === 'PUBLIC' ? 0 : 1,
                    autoApprove: true,
                    owner: group.owner,
                    createdAt: new Date(group.createdAt).getTime() / 1000,
                    exists: true
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}