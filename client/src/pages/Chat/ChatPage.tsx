import React, { useEffect, useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth1 } from '../../context/Context'; // Import Context lấy user
import { setUserAddressHeader } from '../../api/axiosClient';

interface User {
    _id: string;
    address: string;
    username: string;
    avatar: string;
}

export default function ChatPage() {
    // 1. Lấy thông tin User từ Context thay vì Props
    const { user: currentUser } = useAuth1();
    
    // State quản lý hội thoại
    const [currentConv, setCurrentConv] = useState<any | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // 2. Kết nối Socket
    const { incomingMessage, onlineUsers } = useChatSocket(currentUser?.address);

   
    // Handle chọn hội thoại
    const handleSelectConversation = (conv: any, user?: User) => {
        
        const readConv = { ...conv, unreadCount: 0 };
        setCurrentConv(readConv);

        if (user) {
            setSelectedUser(user);
        } else {
            // Tìm đối phương trong mảng participants
            const peer = conv.participants?.find((p: any) => p._id !== currentUser?._id);
            if (peer) setSelectedUser(peer);
        }
    };

    if (!currentUser) return <div className="h-full flex items-center justify-center">Loading...</div>;

    return (
        // ✅ FIX LAYOUT: Dùng h-full để khớp với Outlet, rounded-xl để đẹp hơn trong khung Layout
        <div className="flex h-full w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
            
            {/* Sidebar */}
            <ChatSidebar
                onSelect={handleSelectConversation}
                currentUserId={currentUser._id}
                currentAddress={currentUser.address}
                onlineUserAddresses={onlineUsers}
                incomingMessage={incomingMessage}
                selectedConvId={currentConv?._id}
            />

            {/* Main Window */}
            <div className="flex-1 h-full relative flex flex-col min-w-0 bg-slate-50">
                {currentConv ? (
                    <ChatWindow
                        meAddress={currentUser.address}
                        meUserId={currentUser._id}
                        conversation={currentConv}
                        peerUser={selectedUser}
                        incomingMessage={incomingMessage}
                    />
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}

const EmptyState = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700">Chọn một cuộc trò chuyện</h3>
        <p className="text-sm mt-1">Tin nhắn được bảo mật bằng IPFS</p>
    </div>
);