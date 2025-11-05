import React, { useEffect, useMemo, useState } from 'react';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import { Conversations, setUserAddressHeader } from '../../services/api';
import { ensureMessagingKeySynced } from '../../helper/cryptoSync';
import { ethers } from 'ethers';

export default function ChatPage({ me }: { me: { address: string; userId: string } }) {
    const [currentConv, setCurrentConv] = useState<any | null>(null);
    const [peerAddress, setPeerAddress] = useState<string>('');

    // Ví dụ: tạo DM theo địa chỉ ví peer
    async function startDM() {
        if (!ethers.isAddress(peerAddress)) return alert('Địa chỉ không hợp lệ');
        const conv = await Conversations.createDM(peerAddress);
        setCurrentConv(conv);
    }

    useEffect(() => {
        if (!me?.address) return;
        setUserAddressHeader(me.address);
        ensureMessagingKeySynced(me.address);
    }, [me?.address]);

    return (
        <div className="flex h-full">
            <div className="flex flex-col">
                <div className="p-3 border-b">
                    <input className="border px-2 py-1 mr-2" placeholder="Địa chỉ ví đối phương"
                        value={peerAddress} onChange={e => setPeerAddress(e.target.value)} />
                    <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={startDM}>Tạo DM</button>
                </div>
                <ChatSidebar onSelect={setCurrentConv} />
            </div>
            <div className="flex-1">
                {currentConv ? (
                    <ChatWindow
                        meAddress={me.address}
                        meUserId={me.userId}
                        conversation={currentConv}
                        peerAddress={peerAddress /* chỉ dùng cho typing trong ví dụ này */}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Chọn hoặc tạo cuộc trò chuyện
                    </div>
                )}
            </div>
        </div>
    );
}