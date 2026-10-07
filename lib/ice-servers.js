// lib/ice-servers.js - STUN/TURN configuration shared by every signaling server.
//
// STUN is always included. A TURN relay is added when these environment variables are set
// (needed for peers behind symmetric NAT / CGNAT, e.g. most mobile data networks):
//   TURN_URLS        comma-separated, e.g. "turn:turn.example.com:3478,turns:turn.example.com:5349"
//   TURN_USERNAME    TURN username
//   TURN_CREDENTIAL  TURN password / credential

const STUN_SERVERS = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:global.stun.twilio.com:3478' }
];

function turnUrls() {
    return (process.env.TURN_URLS || '').split(',').map(u => u.trim()).filter(Boolean);
}

function hasTurnConfigured() {
    return turnUrls().length > 0 && !!process.env.TURN_USERNAME && !!process.env.TURN_CREDENTIAL;
}

async function getIceServers() {
    const servers = STUN_SERVERS.slice();
    if (hasTurnConfigured()) {
        servers.push({
            urls: turnUrls(),
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_CREDENTIAL
        });
    }
    return servers;
}

module.exports = { getIceServers, hasTurnConfigured };
