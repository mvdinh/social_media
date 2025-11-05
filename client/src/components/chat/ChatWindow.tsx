import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChatMessages } from '../../services/api';
import { connectSignaling } from '../../services/socket';
import {
    getOrCreateMessagingKeypair,
    deriveSharedKey,
    encryptPayload,
    decryptPayload
} from '../../helper/crypto';

type Props = {
    meAddress: string;
    meUserId: string;
    conversation: any;               // server trả e2e.publicKeys: { [userId]: pk }
    peerAddress: string;             // địa chỉ ví đối phương (để gửi typing qua WS)
};

export default function ChatWindow({ meAddress, meUserId, conversation, peerAddress }: Props) {
    const [items, setItems] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<string>('');
    const sharedKeyRef = useRef<Uint8Array | null>(null);
    const { ws, sendTyping } = useMemo(() => connectSignaling(meAddress), [meAddress]);

    // Chuẩn bị shared key khi có cuộc trò chuyện
    useEffect(() => {
        const kp = getOrCreateMessagingKeypair();
        const peerId = conversation?.participants?.find((id: string) => id !== meUserId);
        const peerPk = conversation?.e2e?.publicKeys?.[peerId];
        if (!peerPk) {
            console.warn('⚠️ Peer public key chưa có, chưa thể tạo shared key');
            return;
        }
        sharedKeyRef.current = deriveSharedKey(kp.secretKey, peerPk);
        console.log('🔐 Shared key established between', meUserId, 'and', peerId);
    }, [conversation?._id, meUserId]);

    //  Load lịch sử tin nhắn
    useEffect(() => {
        if (!conversation?._id) return;
        ChatMessages.list(conversation._id).then((res) => {
            setItems(res.items || []);
        });
    }, [conversation?._id]);

    //  Lắng nghe realtime WebSocket
    useEffect(() => {
        function onMessage(e: MessageEvent) {
            const data = JSON.parse(e.data);
            if (!conversation?._id) return;

            // Khi có tin nhắn mới
            if (data.type === 'chat:new' && data.conversationId === conversation._id) {
                if (!sharedKeyRef.current) {
                    console.warn('Shared key chưa sẵn sàng, bỏ qua tin nhắn');
                    return;
                }
                ChatMessages.fetchEncrypted(data.message.cid).then(({ b64 }) => {
                    try {
                        const payload = decryptPayload(sharedKeyRef.current!, data.message.nonce, b64);
                        setItems((prev) => [...prev, { ...data.message, payload }]);
                        ChatMessages.delivered(data.message._id);
                    } catch (err) {
                        console.error('Decrypt failed:', err);
                    }
                });
            }

            // Khi đối phương gửi trạng thái delivered/read
            else if (data.type === 'chat:delivered') {
                setItems((prev) =>
                    prev.map((m) => (m._id === data.messageId ? { ...m, status: 'delivered' } : m))
                );
            } else if (data.type === 'chat:read') {
                setItems((prev) =>
                    prev.map((m) => (m._id === data.messageId ? { ...m, status: 'read' } : m))
                );
            }

            // Khi đối phương đang nhập
            else if (data.type === 'typing' && data.conversationId === conversation._id) {
                setStatus(data.typing ? 'Đang nhập…' : '');
            }
        }

        ws.addEventListener('message', onMessage);
        return () => ws.removeEventListener('message', onMessage);
    }, [ws, conversation?._id]);

    //  Gửi tin nhắn
    async function send() {
        if (!input.trim()) return;
        if (!sharedKeyRef.current) {
            console.warn('Không có shared key, không thể gửi tin');
            return;
        }

        const payload = { t: 'text', text: input, ts: Date.now() };
        try {
            const { nonce, b64 } = encryptPayload(sharedKeyRef.current, payload);
            const up = await ChatMessages.uploadEncrypted(b64, 'msg.bin');

            const msg = await ChatMessages.create({
                conversationId: conversation._id,
                cid: up.cid,
                nonce,
                contentType: 'text/plain',
                bytes: up.bytes,
                preview: input.slice(0, 50)
            });

            setItems((prev) => [...prev, { ...msg, payload }]);
            setInput('');
        } catch (err) {
            console.error(' Send message failed:', err);
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Tin nhắn */}
            <div className="flex-1 overflow-y-auto p-3">
                {items.map((m) => (
                    <div
                        key={m._id}
                        className={`mb-2 ${m.sender === meUserId ? 'text-right' : 'text-left'}`}
                    >
                        <div
                            className={`inline-block rounded px-3 py-2 ${m.sender === meUserId ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                }`}
                        >
                            {m.payload?.t === 'text' ? m.payload.text : '[Nội dung]'}
                        </div>
                        <div className="text-xs opacity-60">{m.status || ''}</div>
                    </div>
                ))}
            </div>

            {/* Trạng thái typing */}
            <div className="h-6 text-xs px-3 opacity-70">{status}</div>

            {/* Ô nhập */}
            <div className="p-2 border-t flex gap-2">
                <input
                    className="flex-1 border rounded px-3 py-2"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => sendTyping(peerAddress, conversation._id, true)}
                    onBlur={() => sendTyping(peerAddress, conversation._id, false)}
                    placeholder="Nhập tin nhắn…"
                />
                <button
                    className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
                    onClick={send}
                >
                    Gửi
                </button>
            </div>
        </div>
    );
}
