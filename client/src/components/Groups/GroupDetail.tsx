import { useParams } from 'react-router-dom';
import { GroupHeader } from './group/GroupHeader';
import { GroupTabs } from './group/GroupTabs';
import { CreateGroupPostBox, CreatePostBox } from './group/CreateGroupPostBox';
import { PostList } from './group/PostList';
import { GroupSidebar } from './group/GroupSidebar';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { GroupPostList } from './group/GroupPostList';

interface GroupData {
  id: string;
  name: string;
  description: string;
  groupType: number;
  autoApprove: boolean;
  owner: string;
  createdAt: number;
  memberCount: number;
  coverImage: string;
  exists: boolean;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('discussion');
  const { address, contracts } = useAuth();
  const groupContract = contracts?.["group"];
  
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id || !groupContract) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('📡 Fetching group data for ID:', id);

        // Lấy dữ liệu từ contract
        const rawGroup = await groupContract.getGroup(id);
        console.log('✅ Raw group from contract:', rawGroup);

        // Parse dữ liệu từ contract
        const group: GroupData = {
          id: rawGroup.id?.toString() || rawGroup[0]?.toString() || id,
          name: rawGroup.name || rawGroup[1] || '',
          description: rawGroup.description || rawGroup[2] || '',
          groupType: typeof rawGroup.groupType === 'number' ? rawGroup.groupType : (rawGroup[3] || 0),
          autoApprove: rawGroup.autoApprove !== undefined ? rawGroup.autoApprove : (rawGroup[4] || false),
          owner: rawGroup.owner || rawGroup[5] || '',
          createdAt: rawGroup.createdAt?.toNumber?.() || (rawGroup[6]?.toNumber?.() || Date.now() / 1000),
          memberCount: rawGroup.memberCount?.toNumber?.() || (rawGroup[7]?.toNumber?.() || 0),
          coverImage: rawGroup.coverImage || rawGroup[8] || '',
          exists: rawGroup.exists !== undefined ? rawGroup.exists : (rawGroup[9] || true)
        };

        console.log('📦 Parsed group:', group);
        setGroupData(group);

      } catch (error: any) {
        console.error('❌ Error fetching group:', error);
        setError(error.message || 'Không thể tải thông tin nhóm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [id, groupContract]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin nhóm...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // No group data
  if (!groupData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy nhóm</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ============ HEADER Full width ============ */}
      <div className="bg-white shadow mb-4">
        <div className="max-w-7xl mx-auto">
          <GroupHeader group={groupData} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-4 grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
  
        {/* LEFT CONTENT */}
        <div className="lg:col-span-2 space-y-4">
          {/* <GroupTabs activeTab={activeTab} onTabChange={setActiveTab} /> */}

          {activeTab === 'discussion' && (
            <>
              <CreateGroupPostBox></CreateGroupPostBox>
             <GroupPostList groupId={id} />
            </>
          )}
        </div>

        {/* RIGHT SIDEBAR – căn thẳng hàng */}
        <div className="lg:col-span-1 mt-4">
          <GroupSidebar group={groupData} />
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;