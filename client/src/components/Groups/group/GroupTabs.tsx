interface GroupTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function GroupTabs({ activeTab, onTabChange }: GroupTabsProps) {
  const tabs = [
    { id: 'about', label: 'Giới thiệu' },
    { id: 'discussion', label: 'Thảo luận' },
    { id: 'members', label: 'Mọi người' },
    { id: 'events', label: 'Sự kiện' },
    { id: 'media', label: 'File phương tiện' },
    { id: 'files', label: 'File' },
  ];

  return (
    <div className="bg-white mt-4 rounded-lg shadow overflow-x-auto">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-3 whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
