import { useEffect, useRef, useState } from 'react';

// ⚠️ Đổi URL này theo môi trường của bạn (VD: wss://api.yourdomain.com/ws)
const WS_URL = 'ws://localhost:3000/ws';

export const useChatSocket = (address?: string) => {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [incomingMessage, setIncomingMessage] = useState<any>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

    useEffect(() => {
        if (!address) return;

        // 1. Init Connection
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
            console.log('🟢 WS Connected');
            setIsConnected(true);
            
            // 2. Register User Address
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ 
                    type: 'register', 
                    address: address 
                }));
            }
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                switch (data.type) {
                    case 'chat:new':
                        // data.message chứa tin nhắn mới
                        // data.conversationId chứa ID cuộc trò chuyện
                        setIncomingMessage(data);
                        break;
                    
                    case 'presence':
                        // data.online là mảng address đang online
                        setOnlineUsers(data.online || []);
                        break;
                        
                    default:
                        break;
                }
            } catch (error) {
                console.error('WS Parse Error:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('🔴 WS Disconnected');
            setIsConnected(false);
            setOnlineUsers([]);
        };

        return () => {
            ws.current?.close();
        };
    }, [address]);

    return { isConnected, incomingMessage, onlineUsers };
};