// api/signaling.js - Built-in HTTP polling signaling server (Vercel serverless function).
//
// The page talks to this endpoint when its signaling URL is "/api/signaling":
//   POST ?action=init   { phone }              -> INIT packet + session token
//   GET  ?action=poll   id, token[, hb, phone, book] -> { messages, phoneBook? }
//   POST ?action=send   { id, token, packets } -> { messages } (direct replies)
//   POST ?action=leave  { id, token }          (sendBeacon on page close)
//   GET  ?action=ice                           -> { iceServers, turn }
//   GET  (no action)                           -> health
//
// It only relays WebRTC setup messages (SDP offers/answers, ICE candidates, call requests and
// the phone directory). File data and the AES-256-GCM session keys never pass through here:
// they travel peer-to-peer over the DataChannel after the signed handshake.
//
// Serverless instances do not share memory, so state lives in Upstash Redis (Vercel KV /
// Vercel Marketplace "Upstash for Redis") when its REST env vars are set:
//   KV_REST_API_URL + KV_REST_API_TOKEN   or   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Without them it falls back to process memory, which is fine locally but unreliable on Vercel.

const crypto = require('crypto');
const { getIceServers, hasTurnConfigured } = require('../lib/ice-servers');

const PEER_TTL_S = 60;          // client heartbeats every 20s; idle polls are at most 10s apart
const INBOX_TTL_S = 120;
const INBOX_MAX = 300;
const MAX_PACKETS_PER_SEND = 50;
const MAX_PACKET_BYTES = 32 * 1024;
const PREFIX = 'ghost:sig:';

function normalizePhone(p) {
    return typeof p === 'string' ? p.replace(/\D/g, '') : '';
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────

function redisConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

function createRedisStore({ url, token }) {
    async function call(path, body) {
        const res = await fetch(`${url}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
        return res.json();
    }
    async function pipeline(commands) {
        const out = await call('/pipeline', commands);
        return out.map(r => { if (r.error) throw new Error(r.error); return r.result; });
    }
    async function multi(commands) {
        const out = await call('/multi-exec', commands);
        return out.map(r => { if (r.error) throw new Error(r.error); return r.result; });
    }
    const peerKey = id => `${PREFIX}peer:${id}`;
    const inboxKey = id => `${PREFIX}inbox:${id}`;
    const PEERS = `${PREFIX}peers`;
    const PHONES = `${PREFIX}phones`;

    return {
        mode: 'redis',
        async getPeer(id) {
            const [raw] = await pipeline([['GET', peerKey(id)]]);
            return raw ? JSON.parse(raw) : null;
        },
        async savePeer(peer) {
            await pipeline([
                ['SET', peerKey(peer.id), JSON.stringify(peer), 'EX', String(PEER_TTL_S)],
                ['SADD', PEERS, peer.id],
                ['HSET', PHONES, peer.phone, peer.id]
            ]);
        },
        async touchPeer(id) {
            await pipeline([['EXPIRE', peerKey(id), String(PEER_TTL_S)]]);
        },
        async removePhone(phone, id) {
            const [owner] = await pipeline([['HGET', PHONES, phone]]);
            if (owner === id) await pipeline([['HDEL', PHONES, phone]]);
        },
        async removePeer(peer) {
            await pipeline([
                ['DEL', peerKey(peer.id), inboxKey(peer.id)],
                ['SREM', PEERS, peer.id]
            ]);
            await this.removePhone(peer.phone, peer.id);
        },
        // Live peer ids; ids whose peer key expired are pruned along the way
        async livePeerIds() {
            const [ids] = await pipeline([['SMEMBERS', PEERS]]);
            if (!ids || !ids.length) return [];
            const exists = await pipeline(ids.map(id => ['EXISTS', peerKey(id)]));
            const live = ids.filter((_, i) => exists[i] === 1);
            const dead = ids.filter((_, i) => exists[i] !== 1);
            if (dead.length) await pipeline([['SREM', PEERS, ...dead]]);
            return live;
        },
        async phoneBook() {
            const [flat] = await pipeline([['HGETALL', PHONES]]);
            const entries = [];
            for (let i = 0; flat && i < flat.length; i += 2) entries.push({ phone: flat[i], id: flat[i + 1] });
            if (!entries.length) return [];
            const exists = await pipeline(entries.map(e => ['EXISTS', peerKey(e.id)]));
            const live = entries.filter((_, i) => exists[i] === 1);
            const dead = entries.filter((_, i) => exists[i] !== 1);
            if (dead.length) await pipeline([['HDEL', PHONES, ...dead.map(e => e.phone)]]);
            return live;
        },
        async lookupPhone(phone) {
            const [id] = await pipeline([['HGET', PHONES, phone]]);
            if (!id) return null;
            const [exists] = await pipeline([['EXISTS', peerKey(id)]]);
            return exists === 1 ? id : null;
        },
        async deliver(id, packets) {
            if (!packets.length) return;
            await pipeline([
                ['RPUSH', inboxKey(id), ...packets.map(p => JSON.stringify(p))],
                ['LTRIM', inboxKey(id), String(-INBOX_MAX), '-1'],
                ['EXPIRE', inboxKey(id), String(INBOX_TTL_S)]
            ]);
        },
        async drain(id) {
            const [items] = await multi([['LRANGE', inboxKey(id), '0', '-1'], ['DEL', inboxKey(id)]]);
            return (items || []).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
        }
    };
}

function createMemoryStore() {
    const g = globalThis.__ghostSignalingMemory || (globalThis.__ghostSignalingMemory = {
        peers: new Map(), phones: new Map(), inboxes: new Map()
    });
    const alive = p => p && p.expiresAt > Date.now();
    const prune = () => {
        for (const [id, p] of g.peers) {
            if (!alive(p)) { g.peers.delete(id); g.inboxes.delete(id); }
        }
        for (const [phone, id] of g.phones) if (!g.peers.has(id)) g.phones.delete(phone);
    };
    return {
        mode: 'memory',
        async getPeer(id) { prune(); const p = g.peers.get(id); return alive(p) ? p.data : null; },
        async savePeer(peer) {
            g.peers.set(peer.id, { data: peer, expiresAt: Date.now() + PEER_TTL_S * 1000 });
            g.phones.set(peer.phone, peer.id);
        },
        async touchPeer(id) { const p = g.peers.get(id); if (p) p.expiresAt = Date.now() + PEER_TTL_S * 1000; },
        async removePhone(phone, id) { if (g.phones.get(phone) === id) g.phones.delete(phone); },
        async removePeer(peer) { g.peers.delete(peer.id); g.inboxes.delete(peer.id); this.removePhone(peer.phone, peer.id); },
        async livePeerIds() { prune(); return Array.from(g.peers.keys()); },
        async phoneBook() { prune(); return Array.from(g.phones.entries()).map(([phone, id]) => ({ phone, id })); },
        async lookupPhone(phone) { prune(); return g.phones.get(phone) || null; },
        async deliver(id, packets) {
            const box = g.inboxes.get(id) || [];
            box.push(...packets);
            g.inboxes.set(id, box.slice(-INBOX_MAX));
        },
        async drain(id) { const box = g.inboxes.get(id) || []; g.inboxes.delete(id); return box; }
    };
}

function getStore() {
    const cfg = redisConfig();
    return cfg ? createRedisStore(cfg) : createMemoryStore();
}

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────

function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.end(JSON.stringify(body));
}

// Vercel pre-parses JSON bodies; sendBeacon posts text/plain; plain Node gives a raw stream.
async function readBody(req) {
    if (req.body !== undefined && req.body !== null) {
        if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
        try { return JSON.parse(req.body.toString()); } catch (e) { return {}; }
    }
    let raw = '';
    for await (const chunk of req) {
        raw += chunk;
        if (raw.length > MAX_PACKETS_PER_SEND * MAX_PACKET_BYTES) break;
    }
    try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function randomId() {
    return crypto.randomBytes(6).toString('base64').replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 7).padEnd(7, '0');
}

function safeEqual(a, b) {
    const ab = Buffer.from(String(a || '')), bb = Buffer.from(String(b || ''));
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

async function authenticate(store, id, token) {
    if (!id || !token) return null;
    const peer = await store.getPeer(String(id));
    return peer && safeEqual(peer.token, token) ? peer : null;
}

async function setPhone(store, peer, rawPhone) {
    const phone = normalizePhone(rawPhone);
    if (!phone || phone === peer.phone) return false;
    await store.removePhone(peer.phone, peer.id);
    peer.phone = phone;
    await store.savePeer(peer);
    return true;
}

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

async function handleInit(store, body) {
    let phone = normalizePhone(body.phone);
    if (!phone) {
        do { phone = String(Math.floor(100000 + Math.random() * 900000)); } while (await store.lookupPhone(phone));
    }
    const peer = { id: randomId(), token: crypto.randomBytes(24).toString('hex'), phone };
    await store.savePeer(peer);

    const phoneBook = await store.phoneBook();
    const existingPeers = (await store.livePeerIds()).filter(id => id !== peer.id);
    return {
        type: 'INIT',
        yourId: peer.id,
        yourPhone: phone,
        token: peer.token,
        phoneBook,
        existingPeers
    };
}

async function handlePoll(store, peer, query) {
    if (query.phone) await setPhone(store, peer, query.phone);
    await store.touchPeer(peer.id);
    const out = { messages: await store.drain(peer.id) };
    if (query.book === '1') out.phoneBook = await store.phoneBook();
    return out;
}

// Mirrors the routing rules of signaling-server.js so both servers behave the same.
async function handleSend(store, peer, packets) {
    const replies = [];
    await store.touchPeer(peer.id);

    for (const raw of packets.slice(0, MAX_PACKETS_PER_SEND)) {
        if (!raw || typeof raw !== 'object' || JSON.stringify(raw).length > MAX_PACKET_BYTES) continue;
        // The authenticated session decides who the sender is, never the packet itself
        const packet = { ...raw, sender: peer.id };

        if (typeof packet.phone === 'string' && packet.type !== 'WHOIS') {
            await setPhone(store, peer, packet.phone);
        }

        switch (packet.type) {
            case 'REGISTER_PHONE':
                replies.push({ type: 'PHONEBOOK_UPDATE', phoneBook: await store.phoneBook() });
                continue;
            case 'LIST_PHONES':
                replies.push({ type: 'PHONEBOOK_REPLY', phoneBook: await store.phoneBook() });
                continue;
            case 'WHOIS':
                replies.push({ type: 'WHOIS_REPLY', phone: packet.phone, clientId: await store.lookupPhone(normalizePhone(packet.phone)) });
                continue;
            case 'GET_PHONE': {
                const entry = (await store.phoneBook()).find(e => e.id === packet.clientId);
                replies.push({ type: 'GET_PHONE_REPLY', clientId: packet.clientId, phone: entry ? entry.phone : null });
                continue;
            }
            case 'RANDOM_PHONE': {
                const book = await store.phoneBook();
                const pick = book.length ? book[Math.floor(Math.random() * book.length)].phone : null;
                replies.push({ type: 'RANDOM_PHONE_REPLY', phone: pick });
                continue;
            }
            case 'PEER_DISCONNECT': {
                await store.removePeer(peer);
                const others = await store.livePeerIds();
                await Promise.all(others.map(id => store.deliver(id, [{ type: 'PEER_LEFT', peerId: peer.id, phone: peer.phone }])));
                return replies;
            }
        }

        // Phone-addressed packets (SEARCH_PHONE dial) go straight to the owner of the number
        if (packet.targetPhone) {
            const targetId = await store.lookupPhone(normalizePhone(packet.targetPhone));
            if (targetId && targetId !== peer.id) {
                await store.deliver(targetId, [packet]);
                replies.push({ type: 'ROUTED', routedTo: targetId, phone: packet.targetPhone });
            } else {
                replies.push({ type: 'ROUTED', reason: 'UNREACHABLE', phone: packet.targetPhone });
            }
            continue;
        }

        // Targeted SDP / ICE / call packets
        if (packet.target) {
            if (await store.getPeer(String(packet.target))) await store.deliver(String(packet.target), [packet]);
            continue;
        }

        // Untargeted (ANNOUNCE_PRESENCE etc.) -> every other live peer
        const others = (await store.livePeerIds()).filter(id => id !== peer.id);
        await Promise.all(others.map(id => store.deliver(id, [packet])));
    }
    return replies;
}

// ─── ENTRY POINT ──────────────────────────────────────────────────────────────

async function handler(req, res) {
    if (req.method === 'OPTIONS') return sendJson(res, 204, {});

    const url = new URL(req.url, 'http://localhost');
    const query = Object.fromEntries(url.searchParams.entries());
    const action = query.action || '';
    const store = getStore();

    try {
        if (action === 'ice') {
            return sendJson(res, 200, { iceServers: await getIceServers(), turn: hasTurnConfigured() });
        }

        if (action === 'init') {
            if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST required' });
            return sendJson(res, 200, await handleInit(store, await readBody(req)));
        }

        if (action === 'poll') {
            const peer = await authenticate(store, query.id, query.token);
            if (!peer) return sendJson(res, 401, { error: 'Unknown or expired session' });
            return sendJson(res, 200, await handlePoll(store, peer, query));
        }

        if (action === 'send' || action === 'leave') {
            if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST required' });
            const body = await readBody(req);
            const peer = await authenticate(store, body.id, body.token);
            if (!peer) return sendJson(res, 401, { error: 'Unknown or expired session' });
            if (action === 'leave') {
                await handleSend(store, peer, [{ type: 'PEER_DISCONNECT' }]);
                return sendJson(res, 200, { ok: true });
            }
            const packets = Array.isArray(body.packets) ? body.packets : [];
            return sendJson(res, 200, { messages: await handleSend(store, peer, packets) });
        }

        if (!action || action === 'health') {
            return sendJson(res, 200, {
                status: 'online',
                service: 'Ghost Mesh built-in signaling',
                storage: store.mode,
                turnConfigured: hasTurnConfigured(),
                activePeers: (await store.livePeerIds()).length,
                timestamp: new Date().toISOString()
            });
        }

        return sendJson(res, 400, { error: `Unknown action "${action}"` });
    } catch (e) {
        console.error('Signaling error:', e);
        return sendJson(res, 500, { error: 'Signaling server error' });
    }
}

module.exports = handler;
