import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import { format } from 'date-fns';

interface Props {
    onSelect: (conv: any, user?: any) => void;
    currentUserId: string;
    currentAddress: string;
    onlineUserAddresses: string[];
    incomingMessage: any;
    selectedConvId?: string;
}

export default function ChatSidebar({ 
    onSelect, currentUserId, onlineUserAddresses, incomingMessage, selectedConvId 
}: Props) {
    const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');
    const [conversations, setConversations] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Load Conversations
    const loadConversations = useCallback(async () => {
         try {
            const res = await axiosClient.get('/messages/conversations');
            if(res.data.success) setConversations(res.data.items);
         } catch(e) { console.error(e) }
    }, []);

    // Load Users
    const loadUsers = useCallback(async () => {
         try {
            const res = await axiosClient.get('/users', { params: { search: searchQuery } });
            if(res.data.success) setAllUsers(res.data.users);
         } catch(e) { console.error(e) }
    }, [searchQuery]);

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        else loadConversations();
    }, [activeTab, searchQuery]);

    // 🔥 Realtime Sort: Đưa chat mới lên đầu
    useEffect(() => {
        if (!incomingMessage) return;
        const msg = incomingMessage.message;
        const convId = incomingMessage.conversationId;

        setConversations(prev => {
            const index = prev.findIndex(c => c._id === convId);
            let newConvs = [...prev];
            let updatedConv;

            if (index > -1) {
                updatedConv = {
                    ...newConvs[index],
                    lastMessage: { textPreview: msg.content || msg.textPreview, sender: msg.sender },
                    lastMessageAt: new Date(),
                    unreadCount: (selectedConvId === convId) ? 0 : (newConvs[index].unreadCount || 0) + 1
                };
                newConvs.splice(index, 1);
            } else {
                loadConversations(); // Chat mới chưa có trong list -> Reload
                return prev;
            }
            return [updatedConv, ...newConvs];
        });
    }, [incomingMessage, selectedConvId]);

    // Create DM
    const handleUserClick = async (user: any) => {
        try {
            const res = await axiosClient.post('/messages/conversations/dm', { peerAddress: user.address });
            onSelect(res.data, user);
            setActiveTab('conversations');
        } catch(e) { console.error(e); }
    };

    // Filter Online
    const onlineUsersList = allUsers.filter(u => 
        u._id !== currentUserId && onlineUserAddresses.map(a => a.toLowerCase()).includes(u.address.toLowerCase())
    );

    return (
        <div className="w-80 border-r border-gray-200 h-full flex flex-col bg-white flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Đoạn chat</h2>
                
                {/* Search */}
                <input
                    type="text" 
                    placeholder="Tìm kiếm..."
                    className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('conversations')} className={`flex-1 py-1 text-xs font-bold rounded ${activeTab === 'conversations' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Gần đây</button>
                    <button onClick={() => setActiveTab('users')} className={`flex-1 py-1 text-xs font-bold rounded ${activeTab === 'users' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Mọi người</button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'conversations' ? (
                    <div className="p-2 space-y-1">
                        {conversations.map(conv => (
                            <ConversationItem
                                key={conv._id}
                                conversation={conv}
                                currentUserId={currentUserId}
                                isSelected={selectedConvId === conv._id}
                                onClick={() => onSelect(conv)}
                            />
                        ))}
                        {conversations.length === 0 && <p className="text-center text-xs text-gray-400 mt-4">Chưa có cuộc hội thoại nào</p>}
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                         {onlineUsersList.length > 0 && <div className="text-xs font-bold text-gray-400 px-2 py-1 uppercase">Online</div>}
                         {onlineUsersList.map(u => <UserItem key={u._id} user={u} isOnline={true} onClick={() => handleUserClick(u)} />)}
                         
                         <div className="text-xs font-bold text-gray-400 px-2 py-1 uppercase mt-2">Tất cả</div>
                         {allUsers.filter(u => u._id !== currentUserId).map(u => <UserItem key={u._id} user={u} onClick={() => handleUserClick(u)} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-components
const ConversationItem = ({ conversation, currentUserId, onClick, isSelected }: any) => {
    const peer = conversation.participants.find((p: any) => p._id !== currentUserId);
    const name = conversation.name || peer?.username || 'Người dùng';
    const avatar = conversation.avatar || peer?.avatar || 'https://via.placeholder.com/150';
    const isUnread = (conversation.unreadCount || 0) > 0;
    
    // Check if Me sent last
    const lastMsgSender = conversation.lastMessage?.sender;
    const isMeLast = (typeof lastMsgSender === 'string' ? lastMsgSender : lastMsgSender?._id) === currentUserId;

    return (
        <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'}`}>
            <div className="relative">
                <img src={avatar} className="w-12 h-12 rounded-full object-cover bg-gray-200" alt="" />
                {conversation.unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h4 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{name}</h4>
                    <span className="text-[10px] text-gray-400">{conversation.lastMessageAt ? format(new Date(conversation.lastMessageAt), 'HH:mm') : ''}</span>
                </div>
                <p className={`text-xs truncate ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>
                    {isMeLast && 'Bạn: '}
                    {conversation.lastMessage?.textPreview || 'Bắt đầu trò chuyện'}
                </p>
            </div>
        </div>
    );
};

const UserItem = ({ user, onClick, isOnline }: any) => (
    <div onClick={onClick} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
        <div className="relative">
            <img src={user.avatar || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover bg-gray-200" alt="" />
            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{user.username}</h4>
            <p className="text-xs text-gray-400 truncate">{user.address}</p>
        </div>
    </div>
);