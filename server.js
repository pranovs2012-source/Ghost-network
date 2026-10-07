// Allow configurable ports via environment variables
const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 8080;

const http = require('http');
const fs = require('fs');
const path = require('path');
const { shatterAndEncrypt, reconstructAndDecrypt } = require('./secure_share');
const { WebSocketServer } = require('ws');

let wss = null;
try {
    if (process.env.PORT && !process.env.WS_PORT) {
        // Single port mode: attach WSS to HTTP server below
    } else {
        wss = new WebSocketServer({ port: WS_PORT }); // Attempt standalone port bind
        wss.on('listening', () => console.log(`⚡ Multi-Peer Ghost Base online at ws://localhost:${WS_PORT}`));
        wss.on('error', (err) => { console.warn('WebSocket server error:', err.message); wss = null; });
    }
} catch (e) {
    console.warn('WebSocket initialization failed, continuing without standalone WebSocket server:', e.message);
}

let clients = new Map(); // Track connections by an explicit unique ID
let phoneBook = new Map(); // phone -> clientId


// HTTP API will log its own start below

if (wss) wss.on('connection', (ws) => {
    // Generate a unique ID for this specific browser window
    const clientId = Math.random().toString(36).substring(2, 9);
    clients.set(clientId, ws);
    
    console.log(`Node Joined: [${clientId}]. Total nodes online: ${clients.size}`);

    // 1. Tell the newly connected tab what its ID is, and send it a list of all existing peers
    // assign a unique numeric phone for simple dialing
    let phone;
    do {
        phone = (Math.floor(100000 + Math.random() * 900000)).toString();
    } while (phoneBook.has(phone));
    phoneBook.set(phone, clientId);

    ws.send(JSON.stringify({
        type: 'INIT',
        yourId: clientId,
        yourPhone: phone,
        phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})),
        existingPeers: Array.from(clients.keys()).filter(id => id !== clientId)
    }));

    // 2. Alert all other open tabs that a brand new peer just arrived (include its phone)
    broadcast({ type: 'PEER_JOINED', newPeerId: clientId, phone }, clientId);
    // notify everyone of updated phone book
    broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) });

    ws.on('message', (message) => {
        try {
            const packet = JSON.parse(message);

            // Dynamically register/update cryptographic phone number for this clientId
            if (packet.phone && typeof packet.phone === 'string') {
                const cleanP = packet.phone.trim();
                if (cleanP && cleanP !== 'undefined' && cleanP !== 'null') {
                    // Remove any old phone for this clientId
                    for (const [p, id] of Array.from(phoneBook.entries())) {
                        if (id === clientId && p !== cleanP) {
                            phoneBook.delete(p);
                        }
                    }
                    if (phoneBook.get(cleanP) !== clientId) {
                        phoneBook.set(cleanP, clientId);
                        broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) });
                    }
                }
            }

            if (packet.type === 'REGISTER_PHONE' && packet.phone) {
                ws.send(JSON.stringify({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) }));
                return;
            }

            // WHOIS lookup: resolve phone -> clientId without forwarding
            if (packet.type === 'WHOIS' && packet.phone) {
                const targetId = phoneBook.get(packet.phone) || null;
                ws.send(JSON.stringify({ type: 'WHOIS_REPLY', phone: packet.phone, clientId: targetId }));
                return;
            }

            // Get phone for a given clientId
            if (packet.type === 'GET_PHONE' && packet.clientId) {
                const entry = Array.from(phoneBook.entries()).find(([p, id]) => id === packet.clientId) || null;
                const phone = entry ? entry[0] : null;
                ws.send(JSON.stringify({ type: 'GET_PHONE_REPLY', clientId: packet.clientId, phone }));
                return;
            }

            // List all known phones
            if (packet.type === 'LIST_PHONES') {
                ws.send(JSON.stringify({ type: 'PHONEBOOK_REPLY', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) }));
                return;
            }

            // Return a random online phone (useful for quick pairing)
            if (packet.type === 'RANDOM_PHONE') {
                const entries = Array.from(phoneBook.entries());
                if (entries.length === 0) { ws.send(JSON.stringify({ type: 'RANDOM_PHONE_REPLY', phone: null })); return; }
                const [phone] = entries[Math.floor(Math.random() * entries.length)];
                ws.send(JSON.stringify({ type: 'RANDOM_PHONE_REPLY', phone }));
                return;
            }

            // SEARCH_PHONE: Route directly if mapped, otherwise broadcast network-wide
            if (packet.type === 'SEARCH_PHONE' && packet.targetPhone) {
                const targetId = phoneBook.get(packet.targetPhone);
                if (targetId && clients.has(targetId)) {
                    clients.get(targetId).send(JSON.stringify({ ...packet, sender: clientId }));
                    ws.send(JSON.stringify({ type: 'ROUTED', routedTo: targetId }));
                } else {
                    // Broadcast network-wide so callee can self-identify by cleanMyPhone
                    broadcast({ ...packet, sender: clientId }, clientId);
                }
                return;
            }

            // If routing by phone number is requested, translate to clientId and forward
            if (packet.targetPhone) {
                const targetId = phoneBook.get(packet.targetPhone);
                if (targetId && clients.has(targetId)) {
                    clients.get(targetId).send(JSON.stringify({ ...packet, sender: clientId }));
                    ws.send(JSON.stringify({ type: 'ROUTED', routedTo: targetId }));
                } else {
                    // Broadcast fallback to all clients
                    broadcast({ ...packet, sender: clientId }, clientId);
                }
                return;
            }

            // Explicit client disconnect signal
            if (packet.type === 'PEER_DISCONNECT') {
                clients.delete(clientId);
                for (const [p, id] of Array.from(phoneBook.entries())) {
                    if (id === clientId) phoneBook.delete(p);
                }
                broadcast({ type: 'PEER_LEFT', peerId: clientId, phone }, clientId);
                broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) });
                return;
            }

            // Route message directly to the targeted peer by id
            if (packet.target && clients.has(packet.target)) {
                clients.get(packet.target).send(JSON.stringify({
                    ...packet,
                    sender: clientId // Stamp who sent it
                }));
            } else {
                // Broadcast un-targeted signals (such as ANNOUNCE_PRESENCE, presence replies, broadcast calls) to all online peers
                broadcast({ ...packet, sender: clientId }, clientId);
            }
        } catch (e) { }
    });

    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`Node Left: [${clientId}]. Remaining: ${clients.size}`);
        // Remove any phoneBook entries that pointed to this clientId
        for (const [p, id] of Array.from(phoneBook.entries())) {
            if (id === clientId) phoneBook.delete(p);
        }

        // announce peer left and updated phone book
        broadcast({ type: 'PEER_LEFT', peerId: clientId, phone }, clientId);
        broadcast({ type: 'PHONEBOOK_UPDATE', phoneBook: Array.from(phoneBook.entries()).map(([p,id])=>({phone:p,id})) });
    });
});

function broadcast(data, excludeId = null) {
    clients.forEach((ws, id) => {
        if (id !== excludeId && ws.readyState === 1) {
            ws.send(JSON.stringify(data));
        }
    });
}

// --- HTTP API: file upload/reconstruct/metadata ---
const storageRoot = path.join(__dirname, 'storage');
function genId() { return Math.random().toString(36).substring(2, 9); }

const httpServer = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/api/upload') {
        try {
            let body = '';
            for await (const chunk of req) body += chunk;
            const j = JSON.parse(body);
            const { filename, dataBase64, receiverPubPem, senderPrivPem, chunkSize } = j;
            if (!filename || !dataBase64 || !receiverPubPem || !senderPrivPem) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'missing fields' }));
                return;
            }

            const id = genId();
            const dir = path.join(storageRoot, id);
            fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, filename);
            fs.writeFileSync(filePath, Buffer.from(dataBase64, 'base64'));

            shatterAndEncrypt(filePath, dir, chunkSize || 65536, receiverPubPem, senderPrivPem);

            const metadata = JSON.parse(fs.readFileSync(path.join(dir, 'metadata.json'), 'utf8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id, metadata }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.method === 'POST' && req.url && req.url.startsWith('/api/reconstruct')) {
        try {
            let body = '';
            for await (const chunk of req) body += chunk;
            const j = JSON.parse(body);
            const { id, receiverPrivPem, senderPubPem } = j;
            if (!id || !receiverPrivPem || !senderPubPem) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'missing fields' }));
                return;
            }
            const dir = path.join(storageRoot, id);
            const metaPath = path.join(dir, 'metadata.json');
            if (!fs.existsSync(metaPath)) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'not found' }));
                return;
            }
            const outFile = path.join(dir, 'reconstructed.bin');
            reconstructAndDecrypt(metaPath, outFile, receiverPrivPem, senderPubPem);
            const data = fs.readFileSync(outFile);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ filename: path.basename(outFile), dataBase64: data.toString('base64') }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    if (req.method === 'GET' && req.url && req.url.startsWith('/api/metadata/')) {
        const id = req.url.split('/').pop();
        const metaPath = path.join(storageRoot, id, 'metadata.json');
        if (!fs.existsSync(metaPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not found' }));
            return;
        }
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ metadata }));
        return;
    }

    // Static file handler (serve index.html, ghost-mesh.html, storage.js, crypto-engine.js)
    if (req.method === 'GET') {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const targetPath = path.join(__dirname, reqPath);

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            const ext = path.extname(targetPath).toLowerCase();
            const mimeTypes = {
                '.html': 'text/html',
                '.js': 'text/javascript',
                '.css': 'text/css',
                '.json': 'application/json',
                '.txt': 'text/plain'
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(targetPath).pipe(res);
            return;
        }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// Handle listen errors (EADDRINUSE, etc.) so the process doesn't crash
httpServer.on('error', (err) => {
    console.warn('HTTP server error:', err.message);
});

httpServer.listen(HTTP_PORT, () => console.log(`HTTP API listening on http://localhost:${HTTP_PORT}`));