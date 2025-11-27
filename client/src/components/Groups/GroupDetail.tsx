import { useParams } from 'react-router-dom';
import { GroupHeader } from './group/GroupHeader';
import { GroupTabs } from './group/GroupTabs';
import { CreatePostBox } from './group/CreatePostBox';
import { PostList } from './group/PostList';
import { GroupSidebar } from './group/GroupSidebar';
import { useState } from 'react';

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('discussion');

  // Mock data
  const groupData = {
    id: id || '1',
    name: 'VIỆC LÀM KHO TẠI HÀ NỘI',
    coverImage: 'https://images.unsplash.com/photo-1646215993316-c98f642303ce?w=1200&h=400&fit=crop',
    type: 'Nhóm Công khai',
    memberCount: '280.0k',
    description:
      'Trong nhóm sẽ có các công việc làm ở kho dành cho mọi người tại khu vực Hà Nội...',
  };

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
    <GroupTabs activeTab={activeTab} onTabChange={setActiveTab} />

    {activeTab === 'discussion' && (
      <>
        <CreatePostBox />
        <PostList />
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
