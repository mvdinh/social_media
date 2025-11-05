import React, { useEffect, useState } from 'react';
import { Conversations } from '../../services/api';

export default function ChatSidebar({ onSelect }: { onSelect: (conv: any) => void }) {
    const [items, setItems] = useState<any[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function load(init = false) {
        if (loading) return;
        setLoading(true);
        const res = await Conversations.list(init ? undefined : cursor || undefined);
        setItems(init ? res.items : [...items, ...res.items]);
        setCursor(res.nextCursor);
        setLoading(false);
    }

    useEffect(() => { load(true); }, []);

    return (
        <div className="w-80 border-r h-full overflow-y-auto">
            <div className="p-3 font-semibold">Tin nhắn</div>
            {items.map(c => (
                <div key={c._id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => onSelect(c)}>
                    <div className="text-sm font-medium">Cuộc trò chuyện</div>
                    <div className="text-xs opacity-70">{c.lastMessage?.textPreview || '—'}</div>
                </div>
            ))}
            {cursor && (
                <button className="m-3 text-sm text-blue-600" onClick={() => load(false)}>
                    Tải thêm
                </button>
            )}
        </div>
    );
}