// services/signalingServer.js
import { WebSocketServer } from 'ws';
import User from '../models/User.js';

let wss;
const peers = new Map(); // address -> ws

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

async function updateUserOnlineStatus(address, isOnline) {
    try {
        await User.findOneAndUpdate(
            { address: address.toLowerCase() },
            {
                isOnline,
                lastSeen: new Date()
            }
        );
    } catch (err) {
        console.error('Failed to update user status:', err);
    }
}

export function initSignalingServer(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    function send(ws, payload) {
        try {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(payload));
            }
        } catch (err) {
            console.error('Send error:', err);
        }
    }

    async function broadcastPresence() {
        const online = Array.from(peers.keys());
        const onlineUsers = await User.find({
            address: { $in: online }
        }).select('address username avatar').lean();

        for (const [, ws] of peers) {
            send(ws, {
                type: 'presence',
                online,
                users: onlineUsers
            });
        }
    }

    wss.on('connection', (ws) => {
        let address = null;
        let heartbeatInterval = null;

        // Heartbeat to detect disconnections
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', async (data) => {
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

                    // Remove old connection if exists
                    if (peers.has(address)) {
                        const oldWs = peers.get(address);
                        if (oldWs !== ws && oldWs.readyState === ws.OPEN) {
                            oldWs.close();
                        }
                    }

                    peers.set(address, ws);
                    await updateUserOnlineStatus(address, true);

                    send(ws, { type: 'registered', address });
                    await broadcastPresence();

                    // Start heartbeat
                    heartbeatInterval = setInterval(() => {
                        if (!ws.isAlive) {
                            clearInterval(heartbeatInterval);
                            ws.terminate();
                            return;
                        }
                        ws.isAlive = false;
                        ws.ping();
                    }, 30000); // 30 seconds

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
                        send(target, {
                            type: 'typing',
                            from: address,
                            conversationId: msg.conversationId,
                            typing: !!msg.typing
                        });
                    }
                    break;
                }

                case 'ping':
                    ws.isAlive = true;
                    send(ws, { type: 'pong' });
                    break;

                default:
                    send(ws, { type: 'error', error: 'unknown_type' });
            }
        });

        ws.on('close', async () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (address) {
                peers.delete(address);
                await updateUserOnlineStatus(address, false);
                await broadcastPresence();
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    // Clean up dead connections
    const cleanupInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(cleanupInterval);
    });

    console.log('🛰️ Signaling WebSocket server initialized at /ws');
}

export function getOnlineAddress() {
    return Array.from(peers.keys());
}