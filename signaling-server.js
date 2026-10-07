/**
 * signaling-server.js - Standalone Minimal WebSocket Signaling Server for Ghost Mesh Network
 * 
 * Optimized for external cloud hosting (Render, Koyeb, Fly.io, Glitch, Railway, Heroku, VPS).
 * Uses single HTTP + WebSocket server listening on process.env.PORT (default 8080).
 * Includes HTTP health check endpoint (GET /) and WebSocket ping/pong keepalive.
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// Connected clients: clientId -> ws
const clients = new Map();
// Cryptographic Phone Directory: phone -> clientId
const phoneBook = new Map();

// Phone numbers are compared by digits only, so "123-456" and "123456" dial the same peer
function normalizePhone(p) {
    return typeof p === 'string' ? p.replace(/\D/g, '') : '';
}

// STUN + TURN config (TURN credentials come from env vars, see lib/ice-servers.js)
const { getIceServers, hasTurnConfigured } = require('./lib/ice-servers');

// Create HTTP server for health checks & WebSocket upgrades
const httpServer = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/ice-servers') {
        const iceServers = await getIceServers();
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify({ iceServers, turn: hasTurnConfigured() }));
        return;
    }

    // Health check endpoint for cloud platforms (Render, Koyeb, Fly.io)
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            status: 'online',
            service: 'Ghost Mesh Minimal Signaling Server',
            activePeers: clients.size,
            turnConfigured: hasTurnConfigured(),
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Ghost Mesh Signaling Server - Use WebSocket (ws:// or wss://)');
});

// Attach WebSocket server to the HTTP server on the same port
const wss = new WebSocketServer({ server: httpServer });

function broadcast(data, excludeId = null) {
    const payload = JSON.stringify(data);
    clients.forEach((ws, id) => {
        if (id !== excludeId && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(payload);
            } catch (err) {
                console.warn(`Failed to send broadcast to [${id}]:`, err.message);
            }
        }
    });
}

wss.on('connection', (ws) => {
    // Generate unique ID for this connection
    const clientId = Math.random().toString(36).substring(2, 9);
    clients.set(clientId, ws);
    ws.isAlive = true;

    console.log(`[${new Date().toISOString()}] Peer Joined: [${clientId}]. Total nodes online: ${clients.size}`);

    // Assign temporary initial phone until client registers its cryptographic phone
    let phone;
    do {
        phone = (Math.floor(100000 + Math.random() * 900000)).toString();
    } while (phoneBook.has(phone));
    phoneBook.set(phone, clientId);

    // Send initial configuration to client
    ws.send(JSON.stringify({
        type: 'INIT',
        yourId: clientId,
        yourPhone: phone,
        phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id })),
        existingPeers: Array.from(clients.keys()).filter(id => id !== clientId)
    }));

    // Broadcast updated phonebook to all peers
    broadcast({ type: 'PEER_JOINED', newPeerId: clientId, phone }, clientId);
    broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id })) });

    // Handle incoming messages
    ws.on('message', (rawMessage) => {
        try {
            const packet = JSON.parse(rawMessage);

            // Dynamically register/update cryptographic phone number for this clientId
            if (packet.phone && typeof packet.phone === 'string') {
                const cleanP = normalizePhone(packet.phone);
                if (cleanP) {
                    // Remove old phones associated with this clientId
                    for (const [p, id] of Array.from(phoneBook.entries())) {
                        if (id === clientId && p !== cleanP) {
                            phoneBook.delete(p);
                        }
                    }
                    phoneBook.set(cleanP, clientId);
                    broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id })) });
                }
            }

            // REGISTER_PHONE signal
            if (packet.type === 'REGISTER_PHONE') {
                const currentBook = Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id }));
                broadcast({
                    type: 'PHONEBOOK_UPDATE',
                    phoneBook: currentBook
                });
                ws.send(JSON.stringify({
                    type: 'PHONEBOOK_UPDATE',
                    phoneBook: currentBook
                }));
                return;
            }

            // WHOIS lookup
            if (packet.type === 'WHOIS' && packet.phone) {
                const targetId = phoneBook.get(normalizePhone(packet.phone)) || null;
                ws.send(JSON.stringify({ type: 'WHOIS_REPLY', phone: packet.phone, clientId: targetId }));
                return;
            }

            // GET_PHONE lookup
            if (packet.type === 'GET_PHONE' && packet.clientId) {
                const entry = Array.from(phoneBook.entries()).find(([p, id]) => id === packet.clientId) || null;
                const foundPhone = entry ? entry[0] : null;
                ws.send(JSON.stringify({ type: 'GET_PHONE_REPLY', clientId: packet.clientId, phone: foundPhone }));
                return;
            }

            // LIST_PHONES query
            if (packet.type === 'LIST_PHONES') {
                ws.send(JSON.stringify({
                    type: 'PHONEBOOK_REPLY',
                    phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id }))
                }));
                return;
            }

            // RANDOM_PHONE query
            if (packet.type === 'RANDOM_PHONE') {
                const entries = Array.from(phoneBook.entries());
                if (entries.length === 0) {
                    ws.send(JSON.stringify({ type: 'RANDOM_PHONE_REPLY', phone: null }));
                    return;
                }
                const [randomPhone] = entries[Math.floor(Math.random() * entries.length)];
                ws.send(JSON.stringify({ type: 'RANDOM_PHONE_REPLY', phone: randomPhone }));
                return;
            }

            // Route by targetPhone (SEARCH_PHONE dial and any phone-addressed packet).
            // This server is the authoritative phone directory, so an unknown number is offline.
            if (packet.targetPhone) {
                const targetId = phoneBook.get(normalizePhone(packet.targetPhone));
                if (targetId && targetId !== clientId && clients.has(targetId)) {
                    clients.get(targetId).send(JSON.stringify({ ...packet, sender: clientId }));
                    ws.send(JSON.stringify({ type: 'ROUTED', routedTo: targetId, phone: packet.targetPhone }));
                } else {
                    ws.send(JSON.stringify({ type: 'ROUTED', reason: 'UNREACHABLE', phone: packet.targetPhone }));
                }
                return;
            }

            // PEER_DISCONNECT explicit signal
            if (packet.type === 'PEER_DISCONNECT') {
                clients.delete(clientId);
                for (const [p, id] of Array.from(phoneBook.entries())) {
                    if (id === clientId) phoneBook.delete(p);
                }
                broadcast({ type: 'PEER_LEFT', peerId: clientId, phone }, clientId);
                broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id })) });
                return;
            }

            // Route targeted WebRTC offer/answer/ICE candidate/handshake packet to specific target client ID
            if (packet.target && clients.has(packet.target)) {
                clients.get(packet.target).send(JSON.stringify({
                    ...packet,
                    sender: clientId
                }));
            } else {
                // Broadcast un-targeted signals (such as ANNOUNCE_PRESENCE, presence replies, broadcast calls) to all online peers
                broadcast({ ...packet, sender: clientId }, clientId);
            }
        } catch (err) {
            console.error(`Error processing message from [${clientId}]:`, err.message);
        }
    });

    // Handle WebSocket ping/pong pong response
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`[${new Date().toISOString()}] Peer Left: [${clientId}]. Remaining online: ${clients.size}`);
        for (const [p, id] of Array.from(phoneBook.entries())) {
            if (id === clientId) phoneBook.delete(p);
        }
        broadcast({ type: 'PEER_LEFT', peerId: clientId, phone }, clientId);
        broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p, id]) => ({ phone: p, id })) });
    });
});

// Ping interval (30 seconds) to maintain active TCP connection through cloud proxy timeouts
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on('close', () => {
    clearInterval(heartbeatInterval);
});

// Listen on HTTP server (which handles both HTTP GET health checks and WebSocket upgrades)
httpServer.listen(PORT, () => {
    console.log(`⚡ Minimal WebSocket Signaling Server listening on port ${PORT}`);
    console.log(`   HTTP Health Check: http://localhost:${PORT}/health`);
    console.log(`   WebSocket URL:     ws://localhost:${PORT}`);
});
