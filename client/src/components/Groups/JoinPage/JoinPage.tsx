import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';
import { GroupCard } from './GroupCard';
import { PendingGroupCard } from './PendingGroupCard';
import { Group, PendingGroup } from '../../../types/group';
import { convertProxyToArray } from '../../../utils/convertData';

export default function JoinPage() {
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];
  
  const [joinedGroups, setJoinedGroups] = useState<Group[]>([]);
  const [pendingGroups] = useState<PendingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJoinedGroups = async () => {
      if (!address || !groupContract) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('📡 Fetching joined groups for:', address);

        const groupsData = await groupContract.getUserGroups(address);
        console.log('✅ Raw groups from contract:', groupsData);

        // Sử dụng convertProxyToArray để convert
        const groupsArray = convertProxyToArray(groupsData);
        console.log('🔄 Converted to array:', groupsArray);

        // Format data
        const formattedGroups: Group[] = groupsArray.map((group: any, index: number) => {
          console.log(`📦 Processing group ${index}:`, group);
          
          return {
            id: group.id?.toString() || group[0]?.toString() || index.toString(),
            name: group.name || group[1] || '',
            description: group.description || group[2] || '',
            groupType: Number(group.groupType ?? group[3] ?? 0),
            autoApprove: Boolean(group.autoApprove ?? group[4] ?? false),
            owner: group.owner || group[5] || '',
            createdAt: Number(group.createdAt?.toString() || group[6]?.toString() || Math.floor(Date.now() / 1000)),
            memberCount: Number(group.memberCount?.toString() || group[7]?.toString() || 0),
            coverImage: group.coverImage || group[8] || '',
            exists: Boolean(group.exists ?? group[9] ?? true)
          };
        });

        console.log('✅ Formatted groups:', formattedGroups);
        setJoinedGroups(formattedGroups);
        
        if (formattedGroups.length === 0) {
          toast.info('Bạn chưa tham gia nhóm nào');
        }
      } catch (error: any) {
        console.error('❌ Error fetching joined groups:', error);
        toast.error('Không thể tải danh sách nhóm: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJoinedGroups();
  }, [address, groupContract]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải danh sách nhóm...</p>
        </div>
      </div>
    );
  }

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Pending Groups Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Yêu cầu tham gia nhóm đang chờ ({pendingGroups.length})
          </h2>
          <p className="text-gray-600 mb-4 text-sm">
            Xem các nhóm và kênh bảng feed mà bạn đã yêu cầu tham gia. Có thể bạn sẽ phải trả lời
            câu hỏi thì mới có nhóm mới phê duyệt yêu cầu tham gia của bạn.
          </p>
          
          {pendingGroups.length > 0 ? (
            <div className="space-y-4">
              {pendingGroups.map((group) => (
                <PendingGroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Không có yêu cầu đang chờ
            </div>
          )}
        </div>

        {/* Joined Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Tất cả các nhóm bạn đã tham gia ({joinedGroups.length})
            </h2>
            <button className="text-blue-600 hover:underline text-sm font-medium">
              Sắp xếp
            </button>
          </div>
          
          {joinedGroups.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-2">
                Bạn chưa tham gia nhóm nào
              </p>
              <p className="text-gray-500 text-sm">
                Hãy khám phá và tham gia các nhóm để kết nối với mọi người!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {joinedGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}