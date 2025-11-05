import { WebSocketServer } from 'ws';


let wss;
// map lưu cac peer ddang online(address-> ws)
const peers = new Map();

export function sendToAddress(address, payload) {
    try {
        const ws = peers.get(address?.toLowerCase());
        if (ws && ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(payload));
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}

export function initSignalingServer(server) {
    wss = new WebSocketServer({ server, path: '/ws' });
    function send(ws, payload) {
        try {
            ws.send(JSON.stringify(payload));
        } catch { }
    }

    function broadcastPresence() {
        const online = Array.from(peers.keys());
        for (const [, ws] of peers) send(ws, { type: 'presence', online });
    }

    wss.on('connection', (ws) => {
        let address = null;

        ws.on('message', (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            switch (msg.type) {
                case 'register': {
                    address = msg.address?.toLowerCase();
                    if (!address) return;
                    peers.set(address, ws);
                    send(ws, { type: 'registered', address });
                    broadcastPresence();
                    break;
                }

                case 'signal': {
                    const to = msg.to?.toLowerCase();
                    const target = peers.get(to);
                    if (!to || !target) {
                        return send(ws, { type: 'error', error: 'peer_offline_or_invalid' });
                    }
                    send(target, { type: 'signal', from: address, payload: msg.payload });
                    break;
                }

                case 'typing': {
                    const to = msg.to?.toLowerCase();
                    const target = peers.get(to);
                    if (to && target) {
                        send(target, { type: 'typing', from: address, conversationId: msg.conversationId, typing: !!msg.typing });
                    }
                    break;
                }

                case 'ping':
                    send(ws, { type: 'pong' });
                    break;

                default:
                    send(ws, { type: 'error', error: 'unknown_type' });
            }
        });

        ws.on('close', () => {
            if (address) peers.delete(address);
            broadcastPresence();
        });
    });

    console.log('🛰️ Signaling WebSocket server initialized at /ws');
}

export function getOnlineAddress() {
    return Array.from(peers.keys());
}
