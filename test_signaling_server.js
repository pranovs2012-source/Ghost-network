// test_signaling_server.js - Automated Test for Standalone Minimal WebSocket Signaling Server
const http = require('http');
const { spawn } = require('child_process');
const { WebSocket } = require('ws');

const TEST_PORT = 8888;

function httpGet(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

async function runTest() {
    console.log("=================================================");
    console.log("⚡ TEST: MINIMAL WEBSOCKET SIGNALING SERVER");
    console.log("=================================================\n");

    console.log(`1. Spawning signaling-server.js on test port ${TEST_PORT}...`);
    const serverProc = spawn('node', ['signaling-server.js'], {
        env: { ...process.env, PORT: TEST_PORT.toString() },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for server startup
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
        // 2. HTTP Health Check Verification
        console.log("\n2. Testing HTTP /health endpoint...");
        const res = await httpGet(`http://localhost:${TEST_PORT}/health`);
        console.log(`   HTTP Status Code: ${res.status}`);
        console.log(`   ResponseBody: ${res.data.trim()}`);

        if (res.status !== 200) {
            throw new Error(`Expected HTTP 200 from health check, got ${res.status}`);
        }
        const json = JSON.parse(res.data);
        if (json.status !== 'online' || !json.service.includes('Signaling Server')) {
            throw new Error(`Unexpected JSON response structure: ${res.data}`);
        }
        console.log("   ✅ HTTP Health check PASSED!");

        // 3. WebSocket Peer Connection Verification
        console.log("\n3. Testing WebSocket Peer A Connection...");
        const wsA = new WebSocket(`ws://localhost:${TEST_PORT}`);

        const peerAInit = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Peer A connection timeout')), 3000);
            wsA.on('message', (msg) => {
                const data = JSON.parse(msg);
                if (data.type === 'INIT') {
                    clearTimeout(timeout);
                    resolve(data);
                }
            });
            wsA.on('error', reject);
        });

        console.log(`   Peer A assigned Client ID: [${peerAInit.yourId}] | Initial Phone: ${peerAInit.yourPhone}`);
        if (!peerAInit.yourId || !peerAInit.yourPhone) {
            throw new Error("Peer A failed to receive valid ID or Phone in INIT packet!");
        }
        console.log("   ✅ Peer A WebSocket connection PASSED!");

        // 4. Test Peer B Connection and Peer-to-Peer Message Routing
        console.log("\n4. Testing WebSocket Peer B Connection and Signal Forwarding...");
        const wsB = new WebSocket(`ws://localhost:${TEST_PORT}`);

        const peerBInit = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Peer B connection timeout')), 3000);
            wsB.on('message', (msg) => {
                const data = JSON.parse(msg);
                if (data.type === 'INIT') {
                    clearTimeout(timeout);
                    resolve(data);
                }
            });
            wsB.on('error', reject);
        });
        console.log(`   Peer B assigned Client ID: [${peerBInit.yourId}] | Initial Phone: ${peerBInit.yourPhone}`);

        // Peer A sends routed WebRTC offer to Peer B
        const offerPayload = {
            target: peerBInit.yourId,
            type: 'OFFER',
            sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1'
        };

        const receivedOffer = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Offer routing timeout')), 3000);
            wsB.on('message', (msg) => {
                const data = JSON.parse(msg);
                if (data.type === 'OFFER') {
                    clearTimeout(timeout);
                    resolve(data);
                }
            });
            wsA.send(JSON.stringify(offerPayload));
        });

        console.log(`   Peer B received routed signal from [${receivedOffer.sender}]: type=${receivedOffer.type}`);
        if (receivedOffer.sender !== peerAInit.yourId || receivedOffer.sdp !== offerPayload.sdp) {
            throw new Error("Routed offer payload mismatch!");
        }
        console.log("   ✅ WebRTC signal routing between Peer A and Peer B PASSED!");

        // Clean up WebSockets
        wsA.close();
        wsB.close();

        console.log("\n=================================================");
        console.log("🎉 ALL MINIMAL SIGNALING SERVER TESTS PASSED!");
        console.log("=================================================");

    } finally {
        serverProc.kill('SIGTERM');
    }
}

runTest().catch((err) => {
    console.error("❌ SIGNALING SERVER TEST FAILED:", err);
    process.exit(1);
});
