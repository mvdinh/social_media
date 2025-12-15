import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '../../api/axiosClient';
import { format } from 'date-fns';

interface Props {
    conversation: any;
    meUserId: string;
    meAddress: string;
    peerUser: any;
    incomingMessage: any;
}

export default function ChatWindow({ conversation, meUserId, peerUser, incomingMessage }: Props) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // ✅ 1. FETCH OLD MESSAGES (LỊCH SỬ TIN NHẮN)
    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversation._id) return;
            
            setIsLoadingHistory(true);
            try {
                // Gọi API lấy tin nhắn cũ
                const res = await axiosClient.get('/messages', {
                    params: { conversationId: conversation._id, limit: 50 } // Lấy 50 tin gần nhất
                });
                
                if (res.data.success) {
                    setMessages(res.data.items);
                }
            } catch (error) { 
                console.error("Failed to load history:", error); 
            } finally {
                setIsLoadingHistory(false);
            }
        };
        
        fetchMessages();
    }, [conversation._id]);

    // ✅ 2. REALTIME UPDATE (Nhận tin mới)
    useEffect(() => {
        if (incomingMessage && incomingMessage.conversationId === conversation._id) {
            setMessages(prev => {
                // Tránh trùng lặp tin nhắn
                if(prev.find(m => m._id === incomingMessage.message._id)) return prev;
                return [...prev, incomingMessage.message];
            });
        }
    }, [incomingMessage, conversation._id]);

    // 3. Auto Scroll xuống cuối
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, conversation._id]); // Scroll khi có tin nhắn mới hoặc đổi hội thoại

    // 4. Gửi tin nhắn
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;
        
        const tempContent = newMessage;
        setNewMessage(''); 
        setIsSending(true);

        try {
            const res = await axiosClient.post('/messages', {
                conversationId: conversation._id,
                content: tempContent
            });
            if (res.data.success) {
                // Thêm tin nhắn của mình vào list ngay lập tức
                setMessages(prev => [...prev, res.data.message]);
            }
        } catch (error) {
            console.error("Failed to send");
            alert("Gửi thất bại");
        } finally {
            setIsSending(false);
        }
    };

    const displayName = peerUser?.username || conversation.name || 'Người dùng';
    const displayAvatar = peerUser?.avatar || conversation.avatar || 'https://via.placeholder.com/150';

    return (
        <div className="flex flex-col h-full bg-[#F0F2F5]">
            
            {/* --- HEADER --- */}
            <div className="h-16 px-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <img src={displayAvatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="avatar" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base">{displayName}</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-xs text-gray-500">IPFS Encrypted</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MESSAGE LIST --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoadingHistory && <div className="text-center text-xs text-gray-400">Đang tải lịch sử...</div>}
                
                {messages.length === 0 && !isLoadingHistory && (
                    <div className="text-center text-gray-400 text-sm mt-10">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</div>
                )}

                {messages.map((msg, index) => {
                    // Logic xác định người gửi
                    // Backend có thể trả về sender là object (populate) hoặc string (ID)
                    const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
                    const isMe = senderId === meUserId;
                    
                    // Avatar người gửi (nếu là đối phương)
                    const senderAvatar = !isMe ? (typeof msg.sender === 'object' ? msg.sender.avatar : displayAvatar) : '';

                    return (
                        <div key={msg._id || index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex max-w-[75%] md:max-w-[60%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                
                                {/* Avatar nhỏ bên cạnh tin nhắn đối phương */}
                                {!isMe && (
                                    <img 
                                        src={senderAvatar} 
                                        className="w-6 h-6 rounded-full mb-1 object-cover bg-gray-200" 
                                        alt="" 
                                    />
                                )}

                                {/* Bong bóng chat */}
                                <div className={`px-4 py-2 rounded-2xl text-sm break-words shadow-sm ${
                                    isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                }`}>
                                    {/* Hiển thị nội dung tin nhắn */}
                                    <p>{msg.content || msg.textPreview}</p>
                                    
                                    {/* Thời gian */}
                                    <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : 'Just now'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT --- */}
            <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || isSending}
                        className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md flex items-center justify-center"
                    >
                        {/* Icon Send */}
                        <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
}