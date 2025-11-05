// services/socket.ts
export function connectSignaling(address: string) {
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:4000') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'register', address }));
    });

    function sendTyping(to: string, conversationId: string, typing: boolean) {
        ws.send(JSON.stringify({ type: 'typing', to, conversationId, typing }));
    }

    return { ws, sendTyping };
}